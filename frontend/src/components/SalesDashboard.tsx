import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

interface SalesSummary {
  total_revenue: number;
  total_sales_count: number;
}

interface Sale {
  id: number;
  product_name: string;
  quantity: number;
  total_value: number;
}

interface SalesDashboardProps {
  data: string | SalesSummary | Sale[];
}

export default function SalesDashboard({ data }: SalesDashboardProps) {
  let summary: SalesSummary | null = null;
  let history: Sale[] = [];
  let isSummary = false;
  let isHistory = false;

  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed && typeof parsed === "object" && "total_revenue" in parsed) {
      summary = parsed as SalesSummary;
      isSummary = true;
    } else if (Array.isArray(parsed)) {
      history = parsed as Sale[];
      isHistory = true;
    }
  } catch {
    return <Alert severity="error">Erro ao processar dados de vendas.</Alert>;
  }

  if (!isSummary && !isHistory) {
    return <Alert severity="warning">Formato de dados de vendas não reconhecido.</Alert>;
  }

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      {/* RENDERIZAR SUMÁRIO (KPIs) */}
      {isSummary && summary && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "700", mb: 2, display: "flex", alignItems: "center", gap: 1, color: "success.light" }}>
            <QueryStatsIcon /> Painel de Desempenho Financeiro
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(76, 175, 80, 0.15)",
                  background: "linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <CardContent sx={{ p: 3, display: "flex", alignItems: "center", justifyItems: "center", gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(76, 175, 80, 0.15)", color: "success.main", display: "flex" }}>
                    <MonetizationOnIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", fontWeight: "600", letterSpacing: 0.5 }}>
                      Faturamento Total
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "800", color: "success.main" }}>
                      R$ {summary.total_revenue.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(33, 150, 243, 0.15)",
                  background: "linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <CardContent sx={{ p: 3, display: "flex", alignItems: "center", justifyItems: "center", gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: "rgba(33, 150, 243, 0.15)", color: "primary.main", display: "flex" }}>
                    <ReceiptLongIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", fontWeight: "600", letterSpacing: 0.5 }}>
                      Total de Vendas
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "800", color: "primary.main" }}>
                      {summary.total_sales_count} {summary.total_sales_count === 1 ? "venda" : "vendas"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* RENDERIZAR HISTÓRICO DE TRANSAÇÕES */}
      {isHistory && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "700", mb: 2, display: "flex", alignItems: "center", gap: 1, color: "primary.light" }}>
            <ReceiptLongIcon /> Histórico de Transações Recentes
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <Table size="medium">
              <TableHead sx={{ bgcolor: "rgba(255, 255, 255, 0.04)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "700", color: "text.primary" }}>Transação</TableCell>
                  <TableCell sx={{ fontWeight: "700", color: "text.primary" }}>Produto</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "700", color: "text.primary" }}>Qtd</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "700", color: "text.primary" }}>Valor Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((sale) => (
                  <TableRow
                    key={sale.id}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      transition: "0.2s",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.04)" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: "500", color: "text.secondary" }}>#{sale.id}</TableCell>
                    <TableCell sx={{ fontWeight: "600", color: "text.primary" }}>{sale.product_name}</TableCell>
                    <TableCell align="right" sx={{ color: "text.secondary" }}>{sale.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "700", color: "success.main" }}>
                      R$ {sale.total_value.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
