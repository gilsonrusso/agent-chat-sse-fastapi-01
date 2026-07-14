# Agent Chat SSE: Sistema de Chat com Agentes LangGraph, FastAPI, React e Generative UI

Este repositório contém um sistema de chat completo com suporte a **Server-Sent Events (SSE)**, execução de ferramentas (*tool calling*), interrupções para aprovação humana (**Human-in-the-Loop**), persistência assíncrona completa no **PostgreSQL** e uma arquitetura moderna para ensino de **Generative UI** por meio de intercepção de stream e hidratação dinâmica de componentes.

---

## 🏗️ Visão Geral da Arquitetura

O sistema é composto pelos seguintes componentes:

1. **Frontend (React 19 + TypeScript + Vite + MUI v9):**
   * Interface rica de chat com suporte a streaming caractere por caractere via SSE.
   * Renderização de markdown, blocos de código e micro-animações.
   * **Generative UI**: Interceptação de eventos de componentes para renderizar blocos interativos ricos (como catálogo de produtos com simulação de compra e painel de vendas com gráficos de KPI) diretamente na linha do tempo do chat.
   * Painel interativo para tomada de decisões e aprovação humana (HITL) com possibilidade de editar argumentos JSON.
   * [Documentação do Frontend](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/frontend/README.md)

2. **Agent Service (FastAPI + LangGraph + PostgreSQL):**
   * Backend principal de orquestração do Agente Supervisor.
   * **StreamFilter**: Interceptador reativo de tags do LLM no formato `[RENDER_UI: ...]`. Ele filtra as tags estruturadas do texto do assistente e dispara eventos SSE e persistência em banco.
   * **Banco de Dados (Mensagens)**: Salva mensagens normais e mensagens hidratadas de componentes (com `role: "tool"`, `name: ComponentName` e `content: JSON_Data`) diretamente no PostgreSQL para suporte nativo e durável a histórico de conversas.
   * Integra ferramentas locais escritas em Python para busca de catálogo de produtos, histórico de vendas, e-mails, tempo e manipulação de arquivos.
   * [Documentação do Agent Service](file:///mnt/c0b6217c-c2f3-4c1f-8ba2-c8d177f718a9/development/personal/agent-chat-sse-fastapi-01/agent-service/README.md)

3. **PostgreSQL & Adminer (Docker Compose):**
   * Persistência de mensagens, sessões de chat e checkpoints de gravação.

---

## ⚡ Como Rodar o Projeto

A maneira mais rápida e fácil de executar toda a stack (PostgreSQL, Adminer, Backend e Frontend) é utilizando o Docker Compose:

### 1. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do repositório com sua chave de API da Gemini:
```env
GEMINI_API_KEY="sua_chave_api_aqui"
GEMINI_MODEL="gemini-2.5-flash-lite"
```

### 2. Subir a Stack Completa
Execute na raiz do projeto:
```bash
docker compose up --build
```

Os serviços estarão disponíveis em:
* **Frontend:** `http://localhost:5173`
* **Backend API / Docs:** `http://localhost:8000/docs`
* **Adminer:** `http://localhost:8080` (Servidor: `postgres`, Usuário: `agent_user`, Senha: `agent_password`, Banco: `agent_chat_db`)
