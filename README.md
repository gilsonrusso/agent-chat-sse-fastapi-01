# Agent Chat SSE: Sistema de Chat com Agentes LangGraph, FastAPI e React

Este repositório contém um sistema de chat avançado completo, com suporte a **Server-Sent Events (SSE)**, execução de ferramentas (*tool calling*), interrupções para aprovação humana (**Human-in-the-Loop**) e persistência completa em **PostgreSQL** (tanto para as tabelas de mensagens da aplicação quanto para a memória interna de checkpoints do agente).

---

## 🏗️ Visão Geral da Arquitetura

O sistema é dividido em três partes principais:

1. **Frontend (React 19 + TypeScript + Vite + MUI v9):**
   * Interface rica de chat com suporte a streaming caractere por caractere via SSE.
   * Renderização de markdown e blocos de código.
   * Painel interativo para tomada de decisões e aprovação humana (HITL) com possibilidade de editar argumentos JSON.
   * [Documentação do Frontend](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/frontend/README.md)

2. **Backend (FastAPI + LangGraph + SQLAlchemy + psycopg):**
   * Executa de forma totalmente assíncrona (`async def` e `AsyncSession`).
   * Gerencia o agente inteligente construído no LangGraph, configurado para pausar antes de executar ferramentas sensíveis.
   * Utiliza o **PostgreSQL** para salvar threads/mensagens e os checkpoints internos (estado) do agente.
   * [Documentação do Backend](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/agent-service/README.md)

3. **Banco de Dados (PostgreSQL + Adminer via Docker Compose):**
   * PostgreSQL rodando como banco centralizado de produção.
   * Adminer para gerenciamento e auditoria visual das tabelas.

Para uma descrição detalhada de fluxo de chamadas, persistência e arquitetura, consulte o documento:
👉 **[Guia de Arquitetura e Decisões (HITL)](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/docs/architecture.md)**

---

## ⚡ Como Rodar o Projeto

### 1. Iniciar o Banco de Dados (PostgreSQL)
Certifique-se de que o Docker esteja instalado e execute na raiz do projeto:
```bash
docker compose up -d
```

### 2. Configurar e Iniciar o Backend
Navegue até a pasta `agent-service/`, configure o arquivo `.env` com suas credenciais e chave do Gemini, e inicie o servidor:
```bash
cd agent-service
uv sync
uv run fastapi dev
```

### 3. Configurar e Iniciar o Frontend
Navegue até a pasta `frontend/`, configure o arquivo `.env` e rode o dev server:
```bash
cd frontend
npm install
npm run dev
```

Abra seu navegador em `http://localhost:5173`.
