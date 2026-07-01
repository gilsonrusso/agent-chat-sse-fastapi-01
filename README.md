# Agent Chat SSE: Sistema de Chat com Agentes LangGraph, FastAPI, MCP e React

Este repositório contém um sistema de chat avançado completo, com suporte a **Server-Sent Events (SSE)**, execução de ferramentas (*tool calling*), interrupções para aprovação humana (**Human-in-the-Loop**), persistência completa em **PostgreSQL** e arquitetura de **Supervisor-Workers** utilizando **Model Context Protocol (MCP)** para descoberta dinâmica de ferramentas remotas.

---

## 🏗️ Visão Geral da Arquitetura

O sistema é composto pelos seguintes serviços:

1. **Frontend (React 19 + TypeScript + Vite + MUI v9):**
   * Interface rica de chat com suporte a streaming caractere por caractere via SSE.
   * Renderização de markdown, blocos de código e micro-animações.
   * Painel interativo para tomada de decisões e aprovação humana (HITL) com possibilidade de editar argumentos JSON.
   * [Documentação do Frontend](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/frontend/README.md)

2. **Agent Service (FastAPI + LangGraph + PostgreSQL):**
   * Backend principal de orquestração do Agente Supervisor.
   * Descobre ferramentas remotas via conexão HTTP/SSE ao servidor MCP.
   * Cria subagentes dinâmicos especializados (`products_agent` e `sales_agent`) baseados nas tags das ferramentas descobertas.
   * Salva histórico de mensagens e checkpoints de estado no banco central PostgreSQL.
   * [Documentação do Agent Service](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/agent-service/README.md)

3. **E-Commerce Backend (FastAPI - Porta 8002):**
   * Microsserviço que simula as operações da loja de e-commerce (consulta de produtos e histórico de vendas) fornecendo dados mockados.
   * [Documentação do Backend de E-Commerce](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/backend/README.md)

4. **MCP Server (FastMCP - Porta 8001):**
   * Servidor de Model Context Protocol independente que consome o schema OpenAPI do E-Commerce Backend e expõe suas rotas dinamicamente como ferramentas MCP via transporte HTTP/SSE.
   * [Documentação do Servidor MCP](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/mcp/README.md)

5. **PostgreSQL & Adminer (Docker Compose):**
   * Persistência de mensagens, sessões de chat e checkpoints de gravação.

Para uma descrição detalhada de fluxo de chamadas, persistência e arquitetura, consulte o documento:
👉 **[Guia de Arquitetura e Decisões (HITL e MCP)](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/docs/architecture.md)**

---

## ⚡ Como Rodar o Projeto

Inicie os serviços na ordem correta para garantir a descoberta automática de ferramentas:

### 1. Iniciar o Banco de Dados (PostgreSQL)
Execute na raiz do projeto:
```bash
docker compose up -d
```

### 2. Iniciar o Backend de E-Commerce (Porta 8002)
```bash
cd backend
uv sync
PYTHONPATH=. uv run fastapi dev --port 8002
```

### 3. Iniciar o Servidor MCP (Porta 8001)
```bash
cd mcp
uv sync
uv run python server.py
```

### 4. Iniciar o Agent Service (Porta 8000)
Configure o `.env` na pasta `agent-service/` e inicie:
```bash
cd agent-service
uv sync
uv run fastapi dev
```

### 5. Iniciar o Frontend
```bash
cd frontend
npm install
npm run dev
```

Abra seu navegador em `http://localhost:5173`.
