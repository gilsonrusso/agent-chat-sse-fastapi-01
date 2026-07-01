from typing import Any
from pydantic import BaseModel


class DecisionItem(BaseModel):
    type: str  # "approve", "reject", "edit", "respond"
    message: str | None = None
    edited_action: dict[str, Any] | None = None


class ChatPayload(BaseModel):
    thread_id: str
    user_id: str = "default_user"
    text: str | None = None
    decisions: list[DecisionItem] | None = None
