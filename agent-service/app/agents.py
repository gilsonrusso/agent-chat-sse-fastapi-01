from typing import Any
from deepagents import create_deep_agent
from app.core.llm import get_llm
from app.tools import get_weather, remove_file, fetch_file, notify_email

# O agente principal será inicializado tardiamente (dentro do lifespan)
_agent = None


def init_agent(checkpointer) -> Any:
    """Inicializa e compila o agente inteligente com o checkpointer assíncrono."""
    global _agent
    _agent = create_deep_agent(
        model=get_llm(),
        tools=[get_weather, remove_file, fetch_file, notify_email],
        name="Meu Agent",
        interrupt_on={
            "remove_file": True,  # Default: approve, edit, reject, respond
            "fetch_file": False,  # No interrupts needed
            "notify_email": {
                "allowed_decisions": ["approve", "reject"]
            },  # No editing
        },
        checkpointer=checkpointer,
    )
    return _agent


def get_agent():
    """Retorna a instância compilada do agente."""
    if _agent is None:
        raise RuntimeError(
            "O agente não foi inicializado. Certifique-se de que a aplicação executou o startup lifespan."
        )
    return _agent
