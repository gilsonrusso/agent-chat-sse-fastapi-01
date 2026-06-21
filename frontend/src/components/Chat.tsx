import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useSSEChat } from "../hooks/useSSEChat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


// MUI Components
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import Fade from "@mui/material/Fade";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";

// MUI Icons
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CodeIcon from "@mui/icons-material/Code";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";


const SUGGESTIONS = [
  { text: "Qual o clima em São Paulo?", icon: <WbSunnyIcon fontSize="small" /> },
  { text: "Explique o que é FastAPI", icon: <CodeIcon fontSize="small" /> },
  { text: "Me conte uma piada de programação", icon: <EmojiEmotionsIcon fontSize="small" /> },
];

export default function ChatComponent() {
  const {
    messages,
    isStreaming,
    activeTools,
    error,
    pendingInterrupt,
    sendMessage,
    sendDecision,
    clearMessages,
    abort,
  } = useSSEChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // local state for HITL (Human in the Loop)
  const [rejectMessage, setRejectMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedArgs, setEditedArgs] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Auto-reset state when a new interrupt is received
  useEffect(() => {
    if (pendingInterrupt && pendingInterrupt.action_requests.length > 0) {
      setEditedArgs(JSON.stringify(pendingInterrupt.action_requests[0].args, null, 2));
      setRejectMessage("");
      setIsEditing(false);
      setEditError(null);
    }
  }, [pendingInterrupt]);

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: 800,
        margin: "0 auto",
        bgcolor: "background.default",
        borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
        borderRight: "1px solid rgba(255, 255, 255, 0.05)",
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
              <Typography variant="subtitle1"  sx={{ lineHeight: 1.2, fontWeight: "600" }}>
                Meu Agent
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isStreaming ? "Processando..." : "Online"}
              </Typography>
            </Box>
          </Box>

          {messages.length > 0 && (
            <Tooltip title="Limpar conversa">
              <IconButton onClick={clearMessages} color="inherit" size="medium">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
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
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: "400", maxWidth: 450, mx:"auto" }}  >
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
                        <Typography variant="body2" sx={{ textAlign: "left", mx: "auto", fontWeight:"500" }}>
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
          <Fade in timeout={400}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mx: 1,
                my: 2,
                borderRadius: 4,
                bgcolor: "rgba(255, 152, 0, 0.05)",
                border: "1.5px solid rgba(255, 152, 0, 0.2)",
                position: "relative",
                backdropFilter: "blur(10px)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: "warning.main", width: 36, height: 36 }}>
                  <WarningAmberIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "600", color: "warning.main" }}>
                    Aprovação de Ação Requerida
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    O agente solicitou autorização para executar uma ferramenta.
                  </Typography>
                </Box>
              </Box>

              {pendingInterrupt.action_requests.map((req, idx) => {
                const reviewConfig = pendingInterrupt.review_configs.find(
                  (c) => c.action_name === req.name
                );
                const allowedDecisions = reviewConfig?.allowed_decisions || ["approve", "reject", "edit", "respond"];

                return (
                  <Box key={idx} sx={{ mb: idx < pendingInterrupt.action_requests.length - 1 ? 3 : 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: "700", mb: 1, color: "text.primary" }}>
                      Ferramenta: <code style={{ color: "#ffb74d", backgroundColor: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 4, fontFamily: "monospace" }}>{req.name}</code>
                    </Typography>

                    {isEditing ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          Edite os argumentos no formato JSON:
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          value={editedArgs}
                          onChange={(e) => {
                            setEditedArgs(e.target.value);
                            setEditError(null);
                          }}
                          error={!!editError}
                          helperText={editError}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                              bgcolor: "rgba(0, 0, 0, 0.2)",
                            }
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}>
                          <IconButton
                            color="default"
                            onClick={() => {
                              setIsEditing(false);
                              setEditError(null);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <CancelIcon />
                          </IconButton>
                          <Chip
                            label="Salvar e Enviar"
                            color="primary"
                            onClick={() => {
                              try {
                                const parsed = JSON.parse(editedArgs);
                                setEditError(null);
                                sendDecision([
                                  {
                                    type: "edit",
                                    edited_action: {
                                      name: req.name,
                                      args: parsed,
                                    },
                                  },
                                ]);
                                setIsEditing(false);
                              } catch  {
                                setEditError("JSON inválido. Corrija a sintaxe.");
                              }
                            }}
                            sx={{ px: 1, fontWeight: "600", cursor: "pointer" }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        {/* Arguments Preview */}
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "rgba(0, 0, 0, 0.25)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                            whiteSpace: "pre-wrap",
                            color: "#90caf9",
                            mb: 2,
                            overflowX: "auto"
                          }}
                        >
                          {JSON.stringify(req.args, null, 2)}
                        </Box>

                        {/* Reject Message Field */}
                        {allowedDecisions.includes("reject") && (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Motivo da rejeição (opcional)..."
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                bgcolor: "rgba(255, 255, 255, 0.02)",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                              }
                            }}
                          />
                        )}

                        {/* Action buttons */}
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {allowedDecisions.includes("edit") && (
                            <Chip
                              icon={<EditIcon fontSize="small" />}
                              label="Editar Parâmetros"
                              variant="outlined"
                              color="primary"
                              onClick={() => {
                                setEditedArgs(JSON.stringify(req.args, null, 2));
                                setIsEditing(true);
                              }}
                              sx={{ fontWeight: "500", cursor: "pointer" }}
                            />
                          )}

                          {allowedDecisions.includes("reject") && (
                            <Chip
                              label="Rejeitar Ação"
                              variant="filled"
                              color="error"
                              onClick={() => {
                                sendDecision([
                                  {
                                    type: "reject",
                                    message: rejectMessage.trim() || undefined,
                                  },
                                ]);
                              }}
                              sx={{ fontWeight: "600", cursor: "pointer" }}
                            />
                          )}

                          {allowedDecisions.includes("approve") && (
                            <Chip
                              icon={<CheckCircleIcon fontSize="small" />}
                              label="Aprovar e Executar"
                              variant="filled"
                              color="success"
                              onClick={() => {
                                sendDecision([{ type: "approve" }]);
                              }}
                              sx={{ fontWeight: "600", cursor: "pointer", px: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Paper>
          </Fade>
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
  );
}