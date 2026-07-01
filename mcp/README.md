# MCP Server (Model Context Protocol)

Este microsserviço é o servidor do **Model Context Protocol (MCP)** do sistema. Ele lê dinamicamente a especificação OpenAPI exposta pelo **E-Commerce Backend** (na porta `8002`) e gera as ferramentas correspondentes em tempo real.

O servidor MCP expõe as ferramentas sobre o transporte HTTP/SSE (Server-Sent Events) na porta `8001`, permitindo que o `agent-service` ou outros clientes conectem-se a ele para descobrir e invocar as APIs como ferramentas normais de linguagem natural.

---

## 🚀 Como Rodar o Serviço

Inicie o **E-Commerce Backend** primeiro para que a especificação OpenAPI seja exposta na porta `8002`. Em seguida, execute na pasta `mcp/`:
```bash
uv sync
uv run python server.py
```

O servidor MCP estará disponível no endpoint SSE:
`http://localhost:8001/sse`

---

## 🛠️ Como Funciona o Mapeamento

1. O script [server.py](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/mcp/server.py) importa ou consulta o endpoint de OpenAPI do backend (`http://localhost:8002/openapi.json`).
2. Utiliza `FastMCP.from_openapi(openapi_spec, client)` para converter as rotas `products` e `sales` em ferramentas MCP estruturadas contendo assinaturas de parâmetros apropriadas.
3. Repassa as requisições de ativação de ferramentas de volta ao backend na porta `8002` de forma assíncrona.
