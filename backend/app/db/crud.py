import datetime

from sqlalchemy.orm import Session

from app.db import models, schemas


def get_or_create_thread(
    db: Session, thread_id: str, user_id: str, title: str = "Nova Conversa"
) -> models.ChatThreadModel:
    db_thread = (
        db.query(models.ChatThreadModel)
        .filter(models.ChatThreadModel.id == thread_id)
        .first()
    )
    if not db_thread:
        db_thread = models.ChatThreadModel(id=thread_id, user_id=user_id, title=title)
        db.add(db_thread)
        db.commit()
        db.refresh(db_thread)
    return db_thread


def get_user_threads(
    db: Session, user_id: str, skip: int = 0, limit: int = 100
) -> list[models.ChatThreadModel]:
    return (
        db.query(models.ChatThreadModel)
        .filter(models.ChatThreadModel.user_id == user_id)
        .order_by(models.ChatThreadModel.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_thread_messages(db: Session, thread_id: str) -> list[models.ChatMessageModel]:
    return (
        db.query(models.ChatMessageModel)
        .filter(models.ChatMessageModel.thread_id == thread_id)
        .order_by(models.ChatMessageModel.created_at.asc())
        .all()
    )


def create_chat_message(
    db: Session, message: schemas.MessageCreate
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
    db_thread = (
        db.query(models.ChatThreadModel)
        .filter(models.ChatThreadModel.id == message.thread_id)
        .first()
    )
    if db_thread:
        db_thread.updated_at = datetime.datetime.now(datetime.UTC)

    db.commit()
    db.refresh(db_msg)
    return db_msg


def delete_thread(db: Session, thread_id: str) -> bool:
    db_thread = (
        db.query(models.ChatThreadModel)
        .filter(models.ChatThreadModel.id == thread_id)
        .first()
    )
    if db_thread:
        db.delete(db_thread)
        db.commit()
        return True
    return False
