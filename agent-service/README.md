# Agent Chat SSE - Agent Service (FastAPI + LangGraph + PostgreSQL Async)

Servidor backend desenvolvido em **FastAPI** responsável por fornecer respostas inteligentes via agentes em tempo real utilizando **Server-Sent Events (SSE)**, execução de ferramentas (*tool calling*), interrupções *Human-in-the-Loop* (HITL) e persistência assíncrona completa no **PostgreSQL**.

---

## 🚀 Recursos (Features)

* **Streaming em Tempo Real (SSE):** Transmissão caractere a caractere de respostas do modelo de IA via endpoint `/chat/stream`.
* **Execução de Ferramentas (Tools):** Suporte a chamadas de ferramentas nativas com notificações de início e término em tempo real (`tool_start` / `tool_end`).
* **Human-in-the-Loop (HITL):** Sistema de interrupções para aprovação, rejeição ou edição de parâmetros antes da execução de ferramentas sensíveis.
* **Persistência de Histórico Assíncrona:** Armazenamento de sessões (`chat_threads`) e mensagens (`chat_messages`) no PostgreSQL usando **SQLAlchemy 2.0 (AsyncSession)** e **asyncpg**.
* **Memória do Agente Persistente:** Armazenamento resiliente e escalável dos checkpoints de estado do LangGraph no PostgreSQL utilizando **AsyncPostgresSaver** e **psycopg-pool**.
* **Validação Rigorosa:** Schemas tipados utilizando **Pydantic v2** e injeção de dependência assíncrona nativa do FastAPI (`Depends`, `Annotated`).

---

## 🛠️ Tecnologias Utilizadas

* **Framework Web:** [FastAPI](https://fastapi.tiangolo.com/) (com Ciclo de Vida Lifespan)
* **Servidor ASGI:** Uvicorn
* **Banco de Dados (Mensagens):** SQLAlchemy 2.0 (Async Engine), `asyncpg` (Driver)
* **Banco de Dados (Checkpoints/Memória):** `langgraph-checkpoint-postgres` (AsyncPostgresSaver), `psycopg` com `psycopg-pool` (Driver e Pool)
* **Gerenciador de Pacotes:** [uv](https://github.com/astral-sh/uv)
* **LLM & Agentes:** LangChain / DeepAgents, LangGraph
* **Qualidade de Código:** Ruff (Linter & Formatador)

---

## 📁 Estrutura de Arquivos

```text
agent-service/
├── app/
├── app/
│   ├── core/
│   │   ├── config.py        # Configurações globais (Pydantic Settings & Env Vars)
│   │   ├── llm.py           # Inicialização do Provedor de LLM (Gemini)
│   │   └── logger.py        # Configuração de logs estruturados (Rich)
│   ├── db/
│   │   ├── database.py      # Conexão assíncrona com o banco (create_async_engine)
│   │   ├── models.py        # Modelos ORM (ChatThreadModel & ChatMessageModel)
│   │   ├── schemas.py       # Schemas de entrada/saída (Pydantic v2)
│   │   ├── crud.py          # Operações de banco de dados assíncronas (CRUD)
│   │   └── deps.py          # Gerador de sessão assíncrona (get_db)
│   └── main.py              # Lifespan, compilação do agente e rotas assíncronas
├── pyproject.toml           # Dependências (asyncpg, psycopg, langgraph-checkpoint-postgres)
└── README.md                # Documentação do backend
```

---

## 🔧 Configuração e Instalação

### 1. Pré-requisitos
* Python 3.12 ou superior
* Gerenciador de pacotes `uv` instalado (`pip install uv`) ou ambiente virtual tradicional.
* Docker e Docker Compose instalados e rodando (para o banco PostgreSQL).

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `agent-service/` (ou na raiz do projeto) com as seguintes configurações:

```env
# Provedor LLM (Gemini)
GEMINI_API_KEY="sua_chave_api_aqui"
GEMINI_MODEL="gemini-2.5-flash"

# Servidor & Banco de Dados
HOST="localhost"
PORT=8000
DEBUG=True

# Banco de Dados PostgreSQL (Requerido)
DATABASE_URL="postgresql://agent_user:agent_password@localhost:5432/agent_chat_db"
```

### 3. Instalação das Dependências
```bash
uv sync
```

### 4. Executando o Servidor de Desenvolvimento
```bash
uv run fastapi dev
```
O servidor iniciará automaticamente o pool de conexões com o PostgreSQL, criará as tabelas do SQLAlchemy e migrará as tabelas do checkpointer do LangGraph no startup. A documentação interativa estará em `http://localhost:8000/docs`.

---

## 🗄️ Executando o PostgreSQL e Adminer via Docker

Para rodar o PostgreSQL e o Adminer (ferramenta visual) na raiz do projeto:

```bash
docker compose up -d
```
* **PostgreSQL:** Rodando na porta `5432`.
* **Adminer:** Acesse `http://localhost:8080` (Servidor: `postgres`, Usuário: `agent_user`, Senha: `agent_password`, Banco: `agent_chat_db`).

---

## 📌 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/stream` | Endpoint principal de streaming SSE do chat (com retomada de interrupções). |
| `GET` | `/users/{user_id}/threads` | Lista as conversas/sessões anteriores carregando mensagens via `selectinload`. |
| `GET` | `/threads/{thread_id}/messages` | Retorna o histórico de mensagens de uma sessão específica em ordem cronológica. |
| `DELETE` | `/threads/{thread_id}` | Deleta fisicamente uma sessão e os registros associados. |
