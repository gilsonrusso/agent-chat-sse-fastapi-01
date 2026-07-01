# E-Commerce Backend (API de Produtos e Vendas)

Este é um microsserviço FastAPI que simula endpoints e-commerce de catálogo de produtos e vendas, fornecendo respostas simuladas (mockadas) para consulta do agente inteligente.

Ele roda de forma independente na porta `8002` para fornecer a especificação OpenAPI que o servidor MCP traduzirá para ferramentas.

---

## 🚀 Como Rodar o Serviço

Execute na pasta `backend/`:
```bash
uv sync
PYTHONPATH=. uv run fastapi dev --port 8002
```

O servidor iniciará em `http://localhost:8002` e o schema OpenAPI estará disponível em `http://localhost:8002/openapi.json`.

---

## 🛣️ Endpoints Disponibilizados

### 1. Produtos (Tag: `products`)
* **`GET /products`**: Retorna a lista completa de produtos mockados ( Laptop Pro, Mouse Sem Fio, Monitor 4K ).
* **`GET /products/details`**: Retorna os detalhes de um produto específico informando seu `product_id`.

### 2. Vendas (Tag: `sales`)
* **`GET /sales`**: Retorna o histórico consolidado de transações/vendas efetuadas na loja.
* **`GET /sales/summary`**: Retorna faturamento total (revenue) e contagem total de vendas do histórico.
