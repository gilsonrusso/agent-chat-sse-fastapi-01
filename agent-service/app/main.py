import json
from collections.abc import AsyncIterable
from contextlib import asynccontextmanager
from typing import Annotated, Any
from uuid import uuid4

from deepagents import create_deep_agent
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.sse import EventSourceResponse, ServerSentEvent
from langchain.tools import tool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.types import Command
from psycopg_pool import AsyncConnectionPool
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.llm import get_llm
from app.core.logger import logger
from app.db import crud, schemas
from app.db.database import Base, SessionLocal, engine
from app.db.deps import get_db

# --- Pool de Conexões para o LangGraph ---

connection_pool = AsyncConnectionPool(
    conninfo=settings.DATABASE_URL,
    max_size=10,
    kwargs={"autocommit": True},
    open=False,
)

# O agente e o checkpointer serão inicializados dentro do ciclo de vida (lifespan)
# para garantir que o event loop do asyncio esteja rodando.
agent = None


# --- Tools ---


@tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"It's always sunny in {city}!"


@tool
def remove_file(path: str) -> str:
    """Delete a file from the filesystem."""
    return f"Deleted {path}"


@tool
def fetch_file(path: str) -> str:
    """Read a file from the filesystem."""
    return f"Contents of {path}"


@tool
def notify_email(to: str, subject: str, body: str) -> str:
    """Send an email."""
    return f"Sent email to {to}"


# --- Event LifeCycle ---


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent
    logger.info("Starting up the server (Lifespan)")

    # 1. Abrir o pool de conexões do checkpointer e criar as tabelas necessárias
    await connection_pool.open()
    checkpointer = AsyncPostgresSaver(connection_pool)
    await checkpointer.setup()

    # 2. Inicializar o agente agora que o event loop está ativo
    agent = create_deep_agent(
        model=get_llm(),
        tools=[get_weather, remove_file, fetch_file, notify_email],
        name="Meu Agent",
        interrupt_on={
            "remove_file": True,  # Default: approve, edit, reject, respond
            "fetch_file": False,  # No interrupts needed
            "notify_email": {"allowed_decisions": ["approve", "reject"]},  # No editing
        },
        checkpointer=checkpointer,
    )

    # 3. Criar tabelas da aplicação no banco de dados se não existirem
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    logger.info("Shutting down the server (Lifespan)")
    # 4. Fechar o pool de conexões com segurança
    await connection_pool.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schema ---


class DecisionItem(BaseModel):
    type: str  # "approve", "reject", "edit", "respond"
    message: str | None = None
    edited_action: dict[str, Any] | None = None


class ChatPayload(BaseModel):
    thread_id: str
    user_id: str = "default_user"
    text: str | None = None
    decisions: list[DecisionItem] | None = None


# --- Routes ---


@app.post("/chat/stream", response_class=EventSourceResponse)
async def stream_chat(payload: ChatPayload) -> AsyncIterable[ServerSentEvent]:
    config = {"configurable": {"thread_id": payload.thread_id}}

    async with SessionLocal() as db:
        yield ServerSentEvent(raw_data="[START]", event="lifecycle_start")

        # 1. Definir o input dependendo se é uma nova mensagem ou retoma de interrupção
        if payload.decisions is not None:
            decisions_list = [
                d.model_dump(exclude_none=True) for d in payload.decisions
            ]
            inputs = Command(resume={"decisions": decisions_list})
        elif payload.text is not None:
            inputs = {"messages": [{"role": "user", "content": payload.text}]}

            # Persistir thread e mensagem do usuário no banco
            title = (
                payload.text[:30] + "..." if len(payload.text) > 30 else payload.text
            )
            await crud.get_or_create_thread(
                db,
                thread_id=payload.thread_id,
                user_id=payload.user_id,
                title=title,
            )
            await crud.create_chat_message(
                db,
                schemas.MessageCreate(
                    id=str(uuid4()),
                    thread_id=payload.thread_id,
                    role="user",
                    content=payload.text,
                ),
            )
        else:
            yield ServerSentEvent(
                raw_data="Payload inválido: informe 'text' ou 'decisions'",
                event="error",
            )
            yield ServerSentEvent(raw_data="[DONE]", event="lifecycle_end")
            return

        assistant_content = ""

        # 2. Executar o streaming de eventos
        async for event in agent.astream_events(
            inputs,
            config=config,
            version="v2",
        ):
            kind = event.get("event")
            logger.info(f"event Kind: {kind}")
            logger.info(f"event Config: {config}")

            # Stream text tokens from the model
            if kind == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                logger.info(f"Chunk: {chunk}")
                if (
                    chunk
                    and hasattr(chunk, "content")
                    and isinstance(chunk.content, str)
                    and chunk.content
                ):
                    assistant_content += chunk.content
                    yield ServerSentEvent(raw_data=chunk.content, event="message")

            # Notify when a tool is called
            elif kind == "on_tool_start":
                yield ServerSentEvent(
                    raw_data=event.get("name", ""), event="tool_start"
                )

            # Notify when a tool finishes
            elif kind == "on_tool_end":
                yield ServerSentEvent(raw_data=event.get("name", ""), event="tool_end")

        # Persistir a resposta completa do assistente no banco
        if assistant_content:
            await crud.create_chat_message(
                db,
                schemas.MessageCreate(
                    id=str(uuid4()),
                    thread_id=payload.thread_id,
                    role="assistant",
                    content=assistant_content,
                ),
            )

        # 3. Verificar se o agente parou em uma interrupção de HITL
        state = await agent.aget_state(config)
        if state.tasks and state.tasks[0].interrupts:
            interrupt_value = state.tasks[0].interrupts[0].value
            yield ServerSentEvent(
                raw_data=json.dumps(interrupt_value), event="interrupt"
            )
        else:
            yield ServerSentEvent(raw_data="[DONE]", event="lifecycle_end")


@app.get("/users/{user_id}/threads", response_model=list[schemas.ThreadResponse])
async def read_user_threads(user_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
    return await crud.get_user_threads(db, user_id=user_id)


@app.get("/threads/{thread_id}/messages", response_model=list[schemas.MessageResponse])
async def read_thread_messages(
    thread_id: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    return await crud.get_thread_messages(db, thread_id=thread_id)


@app.delete("/threads/{thread_id}")
async def delete_thread_endpoint(
    thread_id: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    success = await crud.delete_thread(db, thread_id=thread_id)
    if not success:
        raise HTTPException(status_code=404, detail="Thread não encontrada")
    return {"status": "ok", "message": "Thread deletada com sucesso"}
