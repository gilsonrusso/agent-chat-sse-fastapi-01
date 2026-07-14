import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";

interface LayoutNode {
  type: "container" | "text" | "card" | "grid" | "button";
  orientation?: "vertical" | "horizontal";
  spacing?: number;
  value?: string;
  variant?: "h5" | "h6" | "subtitle1" | "body2";
  color?: string;
  title?: string;
  icon?: "product" | "money" | "history" | "sales" | "trend";
  chip?: string;
  label?: string;
  action?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  children?: LayoutNode[];
}

interface JsonUiRendererProps {
  data: string | LayoutNode;
}

export default function JsonUiRenderer({ data }: JsonUiRendererProps) {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  let rootNode: LayoutNode;
  try {
    if (typeof data === "string") {
      rootNode = JSON.parse(data);
    } else {
      rootNode = data;
    }
  } catch {
    return <Alert severity="error">Erro ao interpretar o layout JSON do componente.</Alert>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const triggerAction = (label: string, action: string, params: any) => {
    setActionStatus(
      `Ação executada: **${label}** (${action}) com parâmetros: ${JSON.stringify(params)}`
    );
    setTimeout(() => {
      setActionStatus(null);
    }, 4500);
  };

  function renderNode(node: LayoutNode, index: number): React.ReactElement | null {
    if (!node) return null;

    const key = `${node.type}-${index}`;

    switch (node.type) {
      case "container":
        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              flexDirection: node.orientation === "horizontal" ? { xs: "column", sm: "row" } : "column",
              gap: node.spacing ?? 2,
              width: "100%",
              my: 1.5,
            }}
          >
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </Box>
        );

      case "text":
        return (
          <Typography
            key={key}
            variant={node.variant ?? "body2"}
            sx={{
              color: node.color ?? "text.primary",
              fontWeight: node.variant === "h6" || node.variant === "h5" ? "700" : "500",
              mb: 0.5,
            }}
          >
            {node.value}
          </Typography>
        );

      case "card":
        { const getIcon = () => {
          const style = { fontSize: 32 };
          if (node.icon === "product") return <ShoppingBagIcon color="primary" sx={style} />;
          if (node.icon === "money") return <AttachMoneyIcon color="success" sx={style} />;
          if (node.icon === "history") return <ReceiptLongIcon color="warning" sx={style} />;
          if (node.icon === "sales") return <HistoryIcon color="info" sx={style} />;
          if (node.icon === "trend") return <TrendingUpIcon color="secondary" sx={style} />;
          return null;
        };

        return (
          <Card
            key={key}
            sx={{
              width: "100%",
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: "primary.main",
                background: "rgba(255, 255, 255, 0.05)",
                boxShadow: "0 8px 24px rgba(33, 150, 243, 0.12)",
              },
            }}
          >
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {getIcon() && (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getIcon()}
                  </Box>
                )}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {node.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", mt: 0.5 }}>
                    {node.value}
                  </Typography>
                </Box>
                {node.chip && (
                  <Chip
                    label={node.chip}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ height: 20, fontSize: "0.75rem", fontWeight: "600" }}
                  />
                )}
              </Box>

              {node.children && node.children.length > 0 && (
                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  {node.children.map((child, idx) => renderNode(child, idx))}
                </Box>
              )}
            </CardContent>
          </Card>
        ); }

      case "grid":
        return (
          <Grid container spacing={node.spacing ?? 2} key={key} sx={{ width: "100%", my: 1.5 }}>
            {node.children?.map((child, idx) => (
              <Grid
                key={idx}
                size={{
                  xs: 12,
                  sm: node.children && node.children.length > 1 ? 6 : 12,
                  md: node.children && node.children.length > 2 ? 4 : 6,
                }}
              >
                {renderNode(child, idx)}
              </Grid>
            ))}
          </Grid>
        );

      case "button":
        return (
          <Button
            key={key}
            variant="contained"
            color="primary"
            size="small"
            onClick={() => triggerAction(node.label ?? "Botão", node.action ?? "click", node.params)}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: "600",
              boxShadow: "none",
              py: 0.75,
              px: 2,
              "&:hover": {
                boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
              },
            }}
          >
            {node.label}
          </Button>
        );

      default:
        return null;
    }
  }

  return (
    <Box sx={{ width: "100%", my: 1 }}>
      {actionStatus && (
        <Fade in timeout={300}>
          <Alert
            icon={<CheckCircleIcon fontSize="inherit" />}
            severity="success"
            sx={{
              mb: 2,
              borderRadius: 3,
              bgcolor: "rgba(76, 175, 80, 0.15)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              color: "success.light",
              "& strong": { fontWeight: "700" },
            }}
          >
            {actionStatus.replace(/\*\*/g, "")}
          </Alert>
        </Fade>
      )}
      {renderNode(rootNode, 0)}
    </Box>
  );
}
