import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import MouseIcon from "@mui/icons-material/Mouse";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { Fade } from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface ProductCatalogProps {
  data: string | Product | Product[];
}

// Retorna um ícone adequado dependendo do produto
function getProductIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("laptop")) return <LaptopMacIcon sx={{ fontSize: 40, color: "primary.main" }} />;
  if (lower.includes("mouse")) return <MouseIcon sx={{ fontSize: 40, color: "primary.main" }} />;
  if (lower.includes("monitor")) return <DesktopWindowsIcon sx={{ fontSize: 40, color: "primary.main" }} />;
  return <ShoppingBagIcon sx={{ fontSize: 40, color: "primary.main" }} />;
}

export default function ProductCatalog({ data }: ProductCatalogProps) {
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  // Normaliza o dado
  let products: Product[] = [];
  try {
    if (typeof data === "string") {
      const parsed = JSON.parse(data);
      products = Array.isArray(parsed) ? parsed : [parsed];
    } else if (Array.isArray(data)) {
      products = data;
    } else if (data && typeof data === "object") {
      products = [data as Product];
    }
  } catch {
    return <Alert severity="error">Erro ao processar dados do catálogo de produtos.</Alert>;
  }

  if (products.length === 0) {
    return <Alert severity="info">Nenhum produto disponível no catálogo no momento.</Alert>;
  }

  const handleSimulatePurchase = (productName: string) => {
    setPurchaseStatus(`Compra simulada com sucesso para o item: **${productName}**!`);
    setTimeout(() => {
      setPurchaseStatus(null);
    }, 4000);
  };

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "700", mb: 2, display: "flex", alignItems: "center", gap: 1, color: "primary.light" }}>
        <ShoppingBagIcon /> Catálogo de Produtos da Loja
      </Typography>

      {purchaseStatus && (
        <Fade in timeout={300}>
          <Alert
            icon={<CheckCircleIcon fontSize="inherit" />}
            severity="success"
            sx={{ mb: 2, borderRadius: 2, bgcolor: "rgba(76, 175, 80, 0.15)", border: "1px solid rgba(76, 175, 80, 0.3)" }}
          >
            {purchaseStatus.replace(/\*\*/g, "")}
          </Alert>
        </Fade>
      )}

      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid size={{ xs: 12, sm: products.length > 1 ? 6 : 12, md: products.length > 2 ? 4 : 6 }} key={product.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(33, 150, 243, 0.15)",
                  borderColor: "primary.main",
                  background: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "rgba(33, 150, 243, 0.1)", mb: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {getProductIcon(product.name)}
                </Box>

                <Typography variant="h6" sx={{ fontWeight: "600", mb: 1, fontSize: "1.1rem" }}>
                  {product.name}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Chip label={`ID: #${product.id}`} size="small" variant="outlined" sx={{ borderColor: "rgba(255, 255, 255, 0.2)", height: 20, fontSize: "0.75rem" }} />
                  <Chip label="Em Estoque" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: "0.75rem" }} />
                </Box>

                <Box sx={{ mt: "auto", width: "100%" }}>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "primary.light", mb: 2 }}>
                    R$ {product.price.toFixed(2)}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<ShoppingBagIcon />}
                    onClick={() => handleSimulatePurchase(product.name)}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: "600",
                      py: 1,
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
                      },
                    }}
                  >
                    Simular Compra
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
