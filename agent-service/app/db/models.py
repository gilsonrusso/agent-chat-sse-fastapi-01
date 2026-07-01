import datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


def utc_now_naive():
    return datetime.datetime.now(datetime.UTC).replace(tzinfo=None)


class ChatThreadModel(Base):
    __tablename__ = "chat_threads"

    id = Column(String, primary_key=True, index=True)  # UUID / thread_id
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=True, default="Nova Conversa")
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(
        DateTime,
        default=utc_now_naive,
        onupdate=utc_now_naive,
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
    created_at = Column(DateTime, default=utc_now_naive)

    thread = relationship("ChatThreadModel", back_populates="messages")
