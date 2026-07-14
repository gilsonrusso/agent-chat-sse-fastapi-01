# Agent Chat SSE - Agent Service (FastAPI + LangGraph + PostgreSQL Async)

Servidor backend desenvolvido em **FastAPI** responsável por fornecer respostas inteligentes via agentes em tempo real utilizando **Server-Sent Events (SSE)**, execução de ferramentas (*tool calling*), interrupções *Human-in-the-Loop* (HITL) e persistência assíncrona completa no **PostgreSQL**. Ele inclui uma camada reativa para habilitar **Generative UI** no frontend por meio de intercepção e hidratação dinâmica de tags de componentes no stream.

---

## 🚀 Recursos (Features)

* **Streaming em Tempo Real (SSE):** Transmissão caractere a caractere de respostas do modelo de IA via endpoint `/chat/stream`.
* **Generative UI StreamFilter:** Interceptação reativa na stream de tokens da LLM. Quando detecta a tag `[RENDER_UI: {"component": "..."}]`, o backend a remove do texto legível do usuário e dispara um evento SSE do tipo `component` contendo os dados mockados locais.
* **Persistência Hidratada de Componentes:** As mensagens geradas por componentes dinâmicos são persistidas no banco com `role: "tool"`, `name: ComponentName` e `content: JSON_Data`, permitindo que o histórico de conversas restaure as interfaces ricas perfeitamente.
* **Execução de Ferramentas (Tools):** Suporte a chamadas de ferramentas locais Python com chips de andamento em tempo real (`tool_start` / `tool_end`).
* **Human-in-the-Loop (HITL):** Sistema de interrupções para aprovação, rejeição ou edição de parâmetros antes da execução de ferramentas de escrita ou ações sensíveis.
* **Memória do Agente Persistente:** Armazenamento resiliente e escalável dos checkpoints de estado do LangGraph no PostgreSQL utilizando **AsyncPostgresSaver** e **psycopg-pool**.

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
│   ├── core/
│   │   ├── config.py        # Configurações globais (Pydantic Settings & Env Vars)
│   │   ├── llm.py           # Inicialização do Provedor de LLM (Gemini)
│   │   └── logger.py        # Configuração de logs estruturados (Rich)
│   ├── db/
│   │   ├── database.py      # Conexão assíncrona com o banco (create_async_engine)
│   │   ├── models.py        # Modelos ORM com nova coluna 'name' para componentes
│   │   ├── schemas.py       # Schemas de entrada/saída (Pydantic v2)
│   │   ├── crud.py          # Operações de banco de dados assíncronas (CRUD)
│   │   └── deps.py          # Gerador de sessão assíncrona (get_db)
│   ├── agents.py            # Definição do prompt e regras do agente LangGraph
│   ├── tools.py             # Ferramentas locais e dados mockados para Generative UI
│   └── main.py              # Lifespan, compilação do agente e rotas assíncronas
├── pyproject.toml           # Dependências (asyncpg, psycopg, langgraph-checkpoint-postgres)
└── README.md                # Documentação do backend
```

---

## 🔧 Configuração e Instalação Local

Para rodar fora do Docker durante o desenvolvimento:

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `agent-service/` com as seguintes configurações:

```env
# Provedor LLM (Gemini)
GEMINI_API_KEY="sua_chave_api_aqui"
GEMINI_MODEL="gemini-2.5-flash-lite"

# Banco de Dados PostgreSQL (Requerido)
DATABASE_URL="postgresql://agent_user:agent_password@localhost:5432/agent_chat_db"
```

### 2. Instalação e Execução
```bash
uv sync
uv run fastapi dev
```

---

## 📌 Endpoints da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/chat/stream` | Endpoint principal de streaming SSE do chat (com filtragem de componentes). |
| `GET` | `/users/{user_id}/threads` | Lista as conversas/sessões anteriores ordenadas por atualização recente. |
| `GET` | `/threads/{thread_id}/messages` | Retorna o histórico de mensagens incluindo as ferramentas persistidas. |
| `DELETE` | `/threads/{thread_id}` | Deleta fisicamente uma sessão e os registros associados. |
