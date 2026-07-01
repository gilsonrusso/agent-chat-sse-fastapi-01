import json
from collections.abc import AsyncIterable
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.sse import EventSourceResponse, ServerSentEvent
from langgraph.types import Command
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents import get_agent
from app.core.logger import logger
from app.db import crud, schemas as db_schemas
from app.db.database import SessionLocal
from app.db.deps import get_db
from app.schemas import ChatPayload

router = APIRouter()


@router.post("/chat/stream", response_class=EventSourceResponse)
async def stream_chat(payload: ChatPayload) -> AsyncIterable[ServerSentEvent]:
    config = {"configurable": {"thread_id": payload.thread_id}}
    agent = get_agent()

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
                db_schemas.MessageCreate(
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
                db_schemas.MessageCreate(
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


@router.get(
    "/users/{user_id}/threads", response_model=list[db_schemas.ThreadResponse]
)
async def read_user_threads(
    user_id: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    return await crud.get_user_threads(db, user_id=user_id)


@router.get(
    "/threads/{thread_id}/messages", response_model=list[db_schemas.MessageResponse]
)
async def read_thread_messages(
    thread_id: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    return await crud.get_thread_messages(db, thread_id=thread_id)


@router.delete("/threads/{thread_id}")
async def delete_thread_endpoint(
    thread_id: str, db: Annotated[AsyncSession, Depends(get_db)]
):
    success = await crud.delete_thread(db, thread_id=thread_id)
    if not success:
        raise HTTPException(status_code=404, detail="Thread não encontrada")
    return {"status": "ok", "message": "Thread deletada com sucesso"}
