from collections.abc import AsyncIterable
import json
from typing import Any

from deepagents import create_deep_agent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.sse import EventSourceResponse, ServerSentEvent
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command
from pydantic import BaseModel

from app.core.llm import get_llm
from app.core.logger import logger

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Tools ---


@tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"It's always sunny in {city}!"


@tool
def remove_file(path: str) -> str:
    """Delete a file from the filesystem."""
    return f"Deleted {path}"


@tool
def fetch_file(path: str) -> str:
    """Read a file from the filesystem."""
    return f"Contents of {path}"


@tool
def notify_email(to: str, subject: str, body: str) -> str:
    """Send an email."""
    return f"Sent email to {to}"


# --- Agent ---

agent = create_deep_agent(
    model=get_llm(),
    tools=[get_weather, remove_file, fetch_file, notify_email],
    name="Meu Agent",
    interrupt_on={
        "remove_file": True,  # Default: approve, edit, reject, respond
        "fetch_file": False,  # No interrupts needed
        "notify_email": {"allowed_decisions": ["approve", "reject"]},  # No editing
    },
    checkpointer=InMemorySaver(),
)


# --- Schema ---


class DecisionItem(BaseModel):
    type: str  # "approve", "reject", "edit", "respond"
    message: str | None = None
    edited_action: dict[str, Any] | None = None


class ChatPayload(BaseModel):
    thread_id: str
    text: str | None = None
    decisions: list[DecisionItem] | None = None


# --- Event LifeCycle


@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the server")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down the server")


# --- Routes ---


@app.post("/chat/stream", response_class=EventSourceResponse)
async def stream_chat(payload: ChatPayload) -> AsyncIterable[ServerSentEvent]:

    config = {"configurable": {"thread_id": payload.thread_id}}

    yield ServerSentEvent(raw_data="[START]", event="lifecycle_start")

    # 1. Definir o input dependendo se é uma nova mensagem ou retoma de interrupção
    if payload.decisions is not None:
        decisions_list = [d.dict(exclude_none=True) for d in payload.decisions]
        inputs = Command(resume={"decisions": decisions_list})
    elif payload.text is not None:
        inputs = {"messages": [{"role": "user", "content": payload.text}]}
    else:
        yield ServerSentEvent(raw_data="Payload inválido: informe 'text' ou 'decisions'", event="error")
        yield ServerSentEvent(raw_data="[DONE]", event="lifecycle_end")
        return

    # 2. Executar o streaming de eventos
    async for event in agent.astream_events(
        inputs,
        config=config,
        version="v2",
    ):
        kind = event.get("event")
        logger.info(f"event Kind: {kind}")
        logger.info(f"event Config: {config}")

        # Stream text tokens from the model
        if kind == "on_chat_model_stream":
            chunk = event.get("data", {}).get("chunk")
            logger.info(f"Chunk: {chunk}")
            if (
                chunk
                and hasattr(chunk, "content")
                and isinstance(chunk.content, str)
                and chunk.content
            ):
                yield ServerSentEvent(raw_data=chunk.content, event="message")

        # Notify when a tool is called
        elif kind == "on_tool_start":
            yield ServerSentEvent(raw_data=event.get("name", ""), event="tool_start")

        # Notify when a tool finishes
        elif kind == "on_tool_end":
            yield ServerSentEvent(raw_data=event.get("name", ""), event="tool_end")

    # 3. Verificar se o agente parou em uma interrupção de HITL
    state = await agent.aget_state(config)
    if state.tasks and state.tasks[0].interrupts:
        interrupt_value = state.tasks[0].interrupts[0].value
        yield ServerSentEvent(raw_data=json.dumps(interrupt_value), event="interrupt")
    else:
        yield ServerSentEvent(raw_data="[DONE]", event="lifecycle_end")
