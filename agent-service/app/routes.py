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
from app.db import crud
from app.db import schemas as db_schemas
from app.db.database import SessionLocal
from app.db.deps import get_db
from app.schemas import ChatPayload

router = APIRouter()


class StreamFilter:
    def __init__(self):
        self.buffer = ""
        self.in_tag = False

    def feed(self, chunk: str) -> list[tuple[str, str]]:
        self.buffer += chunk
        events = []

        while True:
            if not self.in_tag:
                idx = self.buffer.find("[")
                if idx == -1:
                    text_to_yield = self.buffer
                    self.buffer = ""
                    if text_to_yield:
                        events.append(("message", text_to_yield))
                    break
                else:
                    text_to_yield = self.buffer[:idx]
                    self.buffer = self.buffer[idx:]
                    self.in_tag = True
                    if text_to_yield:
                        events.append(("message", text_to_yield))
            else:
                idx = self.buffer.find("]")
                if idx == -1:
                    break
                else:
                    full_tag = self.buffer[: idx + 1]
                    self.buffer = self.buffer[idx + 1 :]
                    self.in_tag = False

                    if full_tag.startswith("[RENDER_UI:"):
                        try:
                            json_str = full_tag[11:-1].strip()
                            tag_data = json.loads(json_str)
                            comp_name = tag_data.get("component")
                            args = tag_data.get("args", {})

                            hydrated_data = None
                            if comp_name == "ProductCatalog":
                                from app.tools import PRODUCTS

                                hydrated_data = PRODUCTS
                            elif comp_name == "SalesDashboard":
                                from app.tools import SALES_HISTORY

                                t = args.get("type", "summary")
                                if t == "summary":
                                    total = sum(
                                        sale["total_value"] for sale in SALES_HISTORY
                                    )
                                    hydrated_data = {
                                        "total_revenue": total,
                                        "total_sales_count": len(SALES_HISTORY),
                                    }
                                else:
                                    hydrated_data = SALES_HISTORY

                            payload = {
                                "component": comp_name,
                                "data": hydrated_data,
                            }
                            events.append(("component", json.dumps(payload)))
                        except Exception as e:
                            logger.error(f"Erro ao processar RENDER_UI tag: {e}")
                    else:
                        events.append(("message", full_tag))
        return events


@router.post("/chat/stream", response_class=EventSourceResponse)
async def stream_chat(payload: ChatPayload) -> AsyncIterable[ServerSentEvent]:
    config = {"configurable": {"thread_id": payload.thread_id}}
    agent = get_agent()
    stream_filter = StreamFilter()

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
                    for event_type, data in stream_filter.feed(chunk.content):
                        if event_type == "message":
                            assistant_content += data
                        elif event_type == "component":
                            comp_payload = json.loads(data)
                            await crud.create_chat_message(
                                db,
                                db_schemas.MessageCreate(
                                    id=str(uuid4()),
                                    thread_id=payload.thread_id,
                                    role="tool",
                                    name=comp_payload["component"],
                                    content=json.dumps(comp_payload["data"]),
                                ),
                            )
                        yield ServerSentEvent(raw_data=data, event=event_type)

            # Notify when a tool is called
            elif kind == "on_tool_start":
                yield ServerSentEvent(
                    raw_data=event.get("name", ""), event="tool_start"
                )

            # Notify when a tool finishes
            elif kind == "on_tool_end":
                yield ServerSentEvent(raw_data=event.get("name", ""), event="tool_end")

        # Enviar qualquer texto remanescente no buffer do filtro de streaming
        if stream_filter.buffer:
            assistant_content += stream_filter.buffer
            yield ServerSentEvent(raw_data=stream_filter.buffer, event="message")

        # Persistir a resposta completa do assistente no banco
        if assistant_content.strip():
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


@router.get("/users/{user_id}/threads", response_model=list[db_schemas.ThreadResponse])
async def read_user_threads(user_id: str, db: Annotated[AsyncSession, Depends(get_db)]):
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
