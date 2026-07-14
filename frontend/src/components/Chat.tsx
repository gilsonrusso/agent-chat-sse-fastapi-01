import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSSEChat } from "../hooks/useSSEChat";
import { ThreadSidebar } from "./ThreadSidebar";

// MUI Components
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
// MUI Icons
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import MenuIcon from "@mui/icons-material/Menu";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import StopIcon from "@mui/icons-material/Stop";
import StoreIcon from "@mui/icons-material/Store";
import PersonIcon from "@mui/icons-material/Person";

import { HITLPanel } from "./HitlPanel";
import ProductCatalog from "./ProductCatalog";
import SalesDashboard from "./SalesDashboard";

const SUGGESTIONS = [
  { text: "Quais produtos você tem?", icon: <StoreIcon fontSize="small" /> },
  { text: "Qual é o resumo das nossas vendas?", icon: <StoreIcon fontSize="small" /> },
  { text: "Quais foram as últimas vendas realizadas?", icon: <StoreIcon fontSize="small" /> },
  { text: "Explique o que é FastAPI", icon: <CodeIcon fontSize="small" /> },
];

export default function ChatComponent() {
  const {
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
  } = useSSEChat();

  const [input, setInput] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTools]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = (textToSend = input) => {
    if (!textToSend.trim() || isStreaming) return;
    sendMessage(textToSend);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", bgcolor: "background.default" }}>
      {/* Sidebar de Histórico de Sessões */}
      <ThreadSidebar
        currentThreadId={threadId}
        onSelectThread={(id) => loadThread(id)}
        onNewChat={clearMessages}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isStreaming={isStreaming}
      />

      {/* Áreas do Chat Principal */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: "rgba(18, 18, 24, 0.8)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, display: { md: "none" } }}
              >
                <MenuIcon />
              </IconButton>

              <Box sx={{ position: "relative" }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                  <SmartToyIcon />
                </Avatar>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: isStreaming ? "warning.main" : "success.main",
                    border: "2px solid #121218",
                    animation: isStreaming ? "pulse 1.5s infinite" : "none",
                    "@keyframes pulse": {
                      "0%": { transform: "scale(0.95)", opacity: 0.5 },
                      "50%": { transform: "scale(1.1)", opacity: 1 },
                      "100%": { transform: "scale(0.95)", opacity: 0.5 },
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: "600" }}>
                  Meu Agent
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isStreaming ? "Processando..." : "Online"}
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            scrollBehavior: "smooth",
            maxWidth: 900,
            width: "100%",
            mx: "auto",
          }}
        >
          {messages.length === 0 && (
            <Fade in timeout={600}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexGrow: 1,
                  textAlign: "center",
                  gap: 3,
                  py: 4,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(33, 150, 243, 0.1)",
                    color: "primary.main",
                    width: 70,
                    height: 70,
                  }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 36 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: "500" }} gutterBottom>
                    Como posso ajudar hoje?
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: "400", maxWidth: 450, mx: "auto" }}>
                    Envie uma mensagem para iniciar o chat em tempo real com streaming de eventos e ferramentas.
                  </Typography>
                </Box>

                {/* Suggestions */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    width: "100%",
                    maxWidth: 450,
                    mt: 2,
                  }}
                >
                  {SUGGESTIONS.map((sug, idx) => (
                    <Card
                      key={idx}
                      variant="outlined"
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.02)",
                        borderColor: "rgba(255, 255, 255, 0.08)",
                        transition: "0.2s",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.05)",
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <CardActionArea onClick={() => handleSend(sug.text)}>
                        <CardContent
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            "&:last-child": { pb: 2 },
                          }}
                        >
                          <Box sx={{ color: "primary.main", display: "flex" }}>
                            {sug.icon}
                          </Box>
                          <Typography variant="body2" sx={{ textAlign: "left", mx: "auto", fontWeight: "500" }}>
                            {sug.text}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              </Box>
            </Fade>
          )}

          {messages.map((msg) => (
            <Fade key={msg.id} in timeout={300}>
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  gap: 1.5,
                  alignItems: "flex-end",
                }}
              >
                {msg.role === "assistant" && (
                  <Avatar sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)", width: 32, height: 32 }}>
                    <SmartToyIcon fontSize="small" sx={{ color: "primary.main" }} />
                  </Avatar>
                )}

                {msg.role === "tool" ? (
                  <Box sx={{ width: "100%", pl: 6 }}>
                    {msg.name === "list_products" || msg.name === "get_product" || msg.name === "ProductCatalog" ? (
                      <ProductCatalog data={msg.content} />
                    ) : msg.name === "list_sales" || msg.name === "get_sales_summary" || msg.name === "SalesDashboard" ? (
                      <SalesDashboard data={msg.content} />
                    ) : (
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          maxWidth: "75%",
                          borderRadius: "20px 20px 20px 4px",
                          bgcolor: "rgba(255, 255, 255, 0.05)",
                          color: "text.primary",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          Tool {msg.name}: {msg.content}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                ) : (
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: "75%",
                      borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      bgcolor: msg.role === "user" ? "primary.main" : "rgba(255, 255, 255, 0.05)",
                      color: msg.role === "user" ? "primary.contrastText" : "text.primary",
                      border: msg.role === "user" ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    {msg.content ? (
                      msg.role === "user" ? (
                        <Typography
                          variant="body1"
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.content}
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                            wordBreak: "break-word",
                            "& p": { my: 0, '&:not(:last-child)': { mb: 1.5 } },
                            "& ul, & ol": { mt: 0, mb: 1.5, pl: 2.5 },
                            "& li": { mb: 0.5 },
                            "& code": {
                              fontFamily: "monospace",
                              bgcolor: "rgba(255, 255, 255, 0.08)",
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 1,
                              fontSize: "0.85rem",
                            },
                            "& pre": {
                              fontFamily: "monospace",
                              bgcolor: "rgba(0, 0, 0, 0.2)",
                              p: 1.5,
                              borderRadius: 1,
                              overflowX: "auto",
                              my: 1.5,
                              "& code": {
                                bgcolor: "transparent",
                                p: 0,
                                fontSize: "0.85rem",
                              },
                            },
                            "& table": {
                              borderCollapse: "collapse",
                              width: "100%",
                              my: 2,
                              fontSize: "0.9rem",
                            },
                            "& th, & td": {
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              padding: "8px 12px",
                            },
                            "& th": {
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              fontWeight: "600",
                              textAlign: "left",
                            },
                            "& tr:nth-of-type(even)": {
                              backgroundColor: "rgba(255, 255, 255, 0.02)",
                            },
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </Box>
                      )
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", minHeight: 20 }}>
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </Box>
                    )}
                  </Paper>
                )}

                {msg.role === "user" && (
                  <Avatar sx={{ bgcolor: "primary.dark", width: 32, height: 32 }}>
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Box>
            </Fade>
          ))}

          {/* Active/Completed Tools */}
          {activeTools.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, my: 1 }}>
              {activeTools.map((tool) => (
                <Chip
                  key={tool.id}
                  avatar={
                    tool.type === "start" ? (
                      <CircularProgress size={14} sx={{ color: "primary.main" }} />
                    ) : (
                      <CheckCircleIcon sx={{ color: "success.main", fontSize: 16 }} />
                    )
                  }
                  label={tool.type === "start" ? `Chamando: ${tool.name}` : `Usou: ${tool.name}`}
                  variant="outlined"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    borderColor: tool.type === "start" ? "rgba(255, 255, 255, 0.08)" : "rgba(76, 175, 80, 0.2)",
                    color: tool.type === "start" ? "text.primary" : "success.main",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </Box>
          )}

          {/* Human-in-the-Loop decision panel */}
          {pendingInterrupt && pendingInterrupt.action_requests.length > 0 && (
            <HITLPanel
              key={JSON.stringify(pendingInterrupt.action_requests)}
              pendingInterrupt={pendingInterrupt}
              sendDecision={sendDecision}
            />
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ width: "100%", borderRadius: 2, mt: 1 }}>
              {error}
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            bgcolor: "background.default",
            maxWidth: 900,
            width: "100%",
            mx: "auto",
          }}
        >
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={isStreaming ? "Aguarde o agente responder..." : "Digite sua mensagem..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.02)",
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
                "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {isStreaming ? (
                      <Tooltip title="Parar geração">
                        <IconButton onClick={abort} color="error" edge="end">
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Enviar mensagem">
                        <span>
                          <IconButton
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            color="primary"
                            edge="end"
                          >
                            <SendIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </InputAdornment>
                ),
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}