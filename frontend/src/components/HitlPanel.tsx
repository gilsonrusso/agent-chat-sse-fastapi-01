import {
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    WarningAmber as WarningAmberIcon
} from "@mui/icons-material";
import {
    Avatar,
    Box,
    Chip,
    Fade,
    IconButton,
    Paper,
    TextField,
    Typography
} from "@mui/material";
import { useState } from "react";
import type { DecisionItem, PendingInterrupt } from "../hooks/useSSEChat";

interface HITLPanelProps {
  pendingInterrupt: PendingInterrupt;
  sendDecision: (decisions: DecisionItem[]) => void;
}

export function HITLPanel({ pendingInterrupt, sendDecision }: HITLPanelProps) {
  const [rejectMessage, setRejectMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedArgs, setEditedArgs] = useState(() =>
    pendingInterrupt.action_requests.length > 0
      ? JSON.stringify(pendingInterrupt.action_requests[0].args, null, 2)
      : ""
  );
  const [editError, setEditError] = useState<string | null>(null);

  return (
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
                        } catch {
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
  );
}