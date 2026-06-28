import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class ChatThreadModel(Base):
    __tablename__ = "chat_threads"

    id = Column(String, primary_key=True, index=True)  # UUID / thread_id
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=True, default="Nova Conversa")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(datetime.UTC),
        onupdate=lambda: datetime.datetime.now(datetime.UTC),
    )

    messages = relationship(
        "ChatMessageModel", back_populates="thread", cascade="all, delete-orphan"
    )


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)  # UUID único da mensagem
    thread_id = Column(
        String, ForeignKey("chat_threads.id"), nullable=False, index=True
    )
    role = Column(String, nullable=False)  # "user", "assistant", "system", "tool"
    content = Column(Text, nullable=False)
    metadata_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))

    thread = relationship("ChatThreadModel", back_populates="messages")
