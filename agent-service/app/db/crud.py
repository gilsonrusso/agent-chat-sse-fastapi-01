import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import models, schemas


async def get_or_create_thread(
    db: AsyncSession, thread_id: str, user_id: str, title: str = "Nova Conversa"
) -> models.ChatThreadModel:
    result = await db.execute(
        select(models.ChatThreadModel).filter(models.ChatThreadModel.id == thread_id)
    )
    db_thread = result.scalars().first()
    if not db_thread:
        db_thread = models.ChatThreadModel(id=thread_id, user_id=user_id, title=title)
        db.add(db_thread)
        await db.commit()
        await db.refresh(db_thread)
    return db_thread


async def get_user_threads(
    db: AsyncSession, user_id: str, skip: int = 0, limit: int = 100
) -> list[models.ChatThreadModel]:
    result = await db.execute(
        select(models.ChatThreadModel)
        .filter(models.ChatThreadModel.user_id == user_id)
        .options(selectinload(models.ChatThreadModel.messages))
        .order_by(models.ChatThreadModel.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_thread_messages(
    db: AsyncSession, thread_id: str
) -> list[models.ChatMessageModel]:
    result = await db.execute(
        select(models.ChatMessageModel)
        .filter(models.ChatMessageModel.thread_id == thread_id)
        .order_by(models.ChatMessageModel.created_at.asc())
    )
    return list(result.scalars().all())


async def create_chat_message(
    db: AsyncSession, message: schemas.MessageCreate
) -> models.ChatMessageModel:
    db_msg = models.ChatMessageModel(
        id=message.id,
        thread_id=message.thread_id,
        role=message.role,
        content=message.content,
        metadata_info=message.metadata_info,
    )
    db.add(db_msg)

    # Atualiza o timestamp updated_at da thread
    result = await db.execute(
        select(models.ChatThreadModel).filter(
            models.ChatThreadModel.id == message.thread_id
        )
    )
    db_thread = result.scalars().first()
    if db_thread:
        db_thread.updated_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)

    await db.commit()
    await db.refresh(db_msg)
    return db_msg


async def delete_thread(db: AsyncSession, thread_id: str) -> bool:
    result = await db.execute(
        select(models.ChatThreadModel).filter(models.ChatThreadModel.id == thread_id)
    )
    db_thread = result.scalars().first()
    if db_thread:
        await db.delete(db_thread)
        await db.commit()
        return True
    return False
