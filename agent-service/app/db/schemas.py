import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


# --- Schemas de Mensagem ---
class MessageBase(BaseModel):
    role: str
    content: str
    metadata_info: dict[str, Any] | None = None


class MessageCreate(MessageBase):
    id: str
    thread_id: str


class MessageResponse(MessageBase):
    id: str
    thread_id: str
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# --- Schemas de Thread (Sessão) ---
class ThreadBase(BaseModel):
    title: str | None = "Nova Conversa"


class ThreadCreate(ThreadBase):
    id: str
    user_id: str


class ThreadResponse(ThreadBase):
    id: str
    user_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: list[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
