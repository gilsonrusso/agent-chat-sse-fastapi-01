import { useState, useCallback, useRef } from "react";
import { v7 as uuidv7 } from "uuid";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ToolEvent {
  id: string;
  name: string;
  type: "start" | "end";
  timestamp: Date;
}

export interface ActionRequest {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any;
  id?: string;
}

export interface ReviewConfig {
  action_name: string;
  allowed_decisions: string[];
}

export interface PendingInterrupt {
  action_requests: ActionRequest[];
  review_configs: ReviewConfig[];
}

export interface DecisionItem {
  type: "approve" | "reject" | "edit" | "respond";
  message?: string;
  edited_action?: {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any;
  };
}

interface UseSSEChatOptions {
  apiUrl?: string;
}

interface UseSSEChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  activeTools: ToolEvent[];
  error: string | null;
  pendingInterrupt: PendingInterrupt | null;
  threadId: string;
  sendMessage: (text: string) => void;
  sendDecision: (decisions: DecisionItem[]) => void;
  clearMessages: () => void;
  loadThread: (selectedThreadId: string) => Promise<void>;
  abort: () => void;
}

function generateId(): string {
  return uuidv7();
}

/**
 * Parses SSE lines from a text chunk.
 * SSE format: "event: <type>\ndata: <payload>\n\n"
 */
function parseSSELines(raw: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = raw.split("\n\n");

  for (const block of blocks) {
    if (!block.trim()) continue;

    let event = "message";
    const dataParts: string[] = [];

    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const content = line.slice(5);
        // Remove only the first single space after 'data:' if it exists
        const formattedContent = content.startsWith(" ")
          ? content.slice(1)
          : content;
        dataParts.push(formattedContent);
      }
    }

    const mergedData = dataParts.join("\n");
    if (dataParts.length > 0) {
      events.push({ event, data: mergedData });
    }
  }

  return events;
}

export function useSSEChat(options: UseSSEChatOptions = {}): UseSSEChatReturn {
  const { apiUrl = "http://localhost:8000/chat/stream" } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingInterrupt, setPendingInterrupt] = useState<PendingInterrupt | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [threadId, setThreadId] = useState<string>(generateId);

  const runChatStream = useCallback(
    async (payload: { text?: string; decisions?: DecisionItem[] }) => {
      setError(null);
      setPendingInterrupt(null);

      let assistantId = generateId();

      if (payload.text !== undefined) {
        const userMessage: ChatMessage = {
          id: generateId(),
          role: "user",
          content: payload.text.trim(),
          timestamp: new Date(),
        };

        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
      } else {
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            assistantId = lastMsg.id;
            return prev;
          } else {
            const assistantMessage: ChatMessage = {
              id: assistantId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
            };
            return [...prev, assistantMessage];
          }
        });
      }

      setIsStreaming(true);
      setActiveTools([]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const bodyPayload = payload.text !== undefined
          ? { text: payload.text.trim(), thread_id: threadId }
          : { decisions: payload.decisions, thread_id: threadId };

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lastDoubleNewline = buffer.lastIndexOf("\n\n");
          if (lastDoubleNewline === -1) continue;

          const complete = buffer.slice(0, lastDoubleNewline + 2);
          buffer = buffer.slice(lastDoubleNewline + 2);

          const sseEvents = parseSSELines(complete);

          for (const sse of sseEvents) {
            switch (sse.event) {
              case "message":
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: msg.content + sse.data }
                      : msg,
                  ),
                );
                break;

              case "tool_start":
                setActiveTools((prev) => [
                  ...prev,
                  {
                    id: generateId(),
                    name: sse.data,
                    type: "start",
                    timestamp: new Date(),
                  },
                ]);
                break;

              case "tool_end":
                setActiveTools((prev) =>
                  prev.map((t) =>
                    t.name === sse.data && t.type === "start"
                      ? { ...t, type: "end" }
                      : t,
                  ),
                );
                break;

              case "interrupt":
                try {
                  const interruptData = JSON.parse(sse.data) as PendingInterrupt;
                  setPendingInterrupt(interruptData);
                } catch (parseErr) {
                  console.error("Error parsing interrupt event:", parseErr);
                }
                break;

              case "error":
                setError(sse.data);
                break;

              case "lifecycle_end":
                break;
            }
          }
        }
      } catch (err) {
        const isAbort =
          (err instanceof DOMException && err.name === "AbortError") ||
          (err instanceof Error && err.name === "AbortError") ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err && (err as any).name === "AbortError");

        if (!isAbort) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          setError(errorMsg);
        }

        // Remove empty assistant message on error or manual abort
        setMessages((prev) =>
          prev.filter((msg) => !(msg.id === assistantId && msg.content === "")),
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [apiUrl, threadId]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming) return;
      runChatStream({ text });
    },
    [isStreaming, runChatStream]
  );

  const sendDecision = useCallback(
    (decisions: DecisionItem[]) => {
      if (isStreaming || !pendingInterrupt) return;
      runChatStream({ decisions });
    },
    [isStreaming, pendingInterrupt, runChatStream]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setActiveTools([]);
    setPendingInterrupt(null);
    setThreadId(generateId());
  }, []);

  const loadThread = useCallback(
    async (selectedThreadId: string) => {
      if (isStreaming) return;
      setError(null);
      setPendingInterrupt(null);
      setActiveTools([]);
      try {
        const baseUrl = apiUrl.replace(/\/chat\/stream$/, "");
        const res = await fetch(`${baseUrl}/threads/${selectedThreadId}/messages`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setThreadId(selectedThreadId);
        setMessages(loadedMessages);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro ao carregar mensagens";
        setError(errorMsg);
      }
    },
    [apiUrl, isStreaming]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    isStreaming,
    activeTools,
    error,
    pendingInterrupt,
    threadId,
    sendMessage,
    sendDecision,
    clearMessages,
    loadThread,
    abort,
  };
}
