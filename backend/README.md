# Agent Chat SSE - Backend (FastAPI + LangGraph + SQLAlchemy)

Servidor backend desenvolvido em **FastAPI** responsável por fornecer respostas inteligentes via agentes em tempo real utilizando **Server-Sent Events (SSE)**, execução de ferramentas (*tool calling*), interrupções *Human-in-the-Loop* (HITL) e persistência de histórico em banco de dados relacional.

---

## 🚀 Recursos (Features)

* **Streaming em Tempo Real (SSE):** Transmissão caractere a caractere de respostas do modelo de IA via endpoint `/chat/stream`.
* **Execução de Ferramentas (Tools):** Suporte a chamadas de ferramentas nativas com notificações de início e término em tempo real (`tool_start` / `tool_end`).
* **Human-in-the-Loop (HITL):** Sistema de interrupções para aprovação, rejeição ou edição de parâmetros antes da execução de ferramentas sensíveis.
* **Persistência de Histórico:** Armazenamento automático de sessões (`chat_threads`) e mensagens (`chat_messages`) via **SQLAlchemy 2.0**.
* **Arquitetura Multi-Banco:** Suporte automático para **SQLite** em ambiente local e **PostgreSQL** para ambiente de produção.
* **Validação Rigorosa:** Schemas tipados utilizando **Pydantic v2** e injeção de dependência nativa do FastAPI (`Depends`, `Annotated`).

---

## 🛠️ Tecnologias Utilizadas

* **Framework Web:** [FastAPI](https://fastapi.tiangolo.com/)
* **Servidor ASGI:** Uvicorn
* **ORMs e Bancos de Dados:** SQLAlchemy 2.0, SQLite, PostgreSQL (`psycopg2-binary`)
* **Gerenciador de Pacotes:** [uv](https://github.com/astral-sh/uv)
* **LLM & Agentes:** LangChain / DeepAgents, LangGraph (InMemorySaver)
* **Qualidade de Código:** Ruff (Linter & Formatador)

---

## 📁 Estrutura de Arquivos

```text
backend/
├── app/
│   ├── core/
│   │   ├── config.py        # Configurações globais (Pydantic Settings & Env Vars)
│   │   ├── llm.py           # Inicialização do Provedor de LLM (Gemini)
│   │   └── logger.py        # Configuração de logs estruturados (Rich)
│   ├── db/
│   │   ├── database.py      # Conexão com o banco (Engine & SessionLocal)
│   │   ├── models.py        # Modelos ORM (ChatThreadModel & ChatMessageModel)
│   │   ├── schemas.py       # Schemas de entrada/saída (Pydantic v2)
│   │   ├── crud.py          # Operações de banco de dados (CRUD)
│   │   └── deps.py          # Gerador de sessão de banco (get_db)
│   └── main.py              # Endpoints REST e streaming SSE
├── pyproject.toml           # Dependências e configurações do projeto
└── README.md                # Documentação do backend
```

---

## 🔧 Configuração e Instalação

### 1. Pré-requisitos
* Python 3.12 ou superior
* Gerenciador de pacotes `uv` instalado (`pip install uv`) ou ambiente virtual tradicional.

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `backend/` (ou na raiz do projeto) com as seguintes configurações:

```env
# Provedor LLM (Gemini)
GEMINI_API_KEY="sua_chave_api_aqui"
GEMINI_MODEL="gemini-2.5-flash"

# Servidor & Banco de Dados
HOST="localhost"
PORT=8000
DEBUG=True

# Banco de Dados (Omitir para usar SQLite por padrão localmente)
DATABASE_URL="sqlite:///./sql_app.db"
# Para produção no PostgreSQL use:
# DATABASE_URL="postgresql://agent_user:agent_password@localhost:5432/agent_chat_db"
```

### 3. Instalação das Dependências
```bash
uv sync
```

### 4. Executando o Servidor de Desenvolvimento
```bash
uv run fastapi dev
```
O servidor estará disponível em `http://localhost:8000` e a documentação interativa Swagger UI em `http://localhost:8000/docs`.

---

## 🗄️ Executando o PostgreSQL e Adminer via Docker

Para simular o ambiente de produção com banco de dados PostgreSQL e uma interface visual de gerenciamento:

```bash
# Na raiz do projeto onde está o docker-compose.yml
docker compose up -d
```
* **PostgreSQL:** Rodando na porta `5432`.
* **Adminer (Interface Gráfica):** Acesse `http://localhost:8080` (Servidor: `postgres`, Usuário: `agent_user`, Senha: `agent_password`, Banco: `agent_chat_db`).

---

## 📌 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/stream` | Endpoint principal de streaming SSE do chat. |
| `GET` | `/users/{user_id}/threads` | Lista todas as conversas/sessões anteriores de um usuário. |
| `GET` | `/threads/{thread_id}/messages` | Retorna o histórico de mensagens de uma sessão específica. |
| `DELETE` | `/threads/{thread_id}` | Deleta fisicamente uma sessão e suas mensagens associadas. |
