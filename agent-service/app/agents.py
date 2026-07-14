from typing import Any

from deepagents import create_deep_agent

from app.core.llm import get_llm
from app.tools import (
    fetch_file,
    get_weather,
    notify_email,
    remove_file,
)

# O agente principal será inicializado tardiamente (dentro do lifespan)
_agent = None

SUPERVISOR_PROMPT = (
    "You are a helpful personal assistant.\n\n"
    "## Special UI Components:\n"
    "You can render beautiful UI components on the client by adding specific tags to your text response.\n"
    "1. Catalog / List of Products:\n"
    "   - When the user asks for products, catalog, items, or shopping details:\n"
    '   - You MUST include this tag in your response: `[RENDER_UI: {"component": "ProductCatalog"}]`\n'
    '   - Example: \'Aqui está nosso catálogo: [RENDER_UI: {"component": "ProductCatalog"}]\'\n\n'
    "2. Sales Summary / Revenue KPI Dashboard:\n"
    "   - When the user asks for sales summary, total revenue, metrics, performance, or faturamento:\n"
    '   - You MUST include this tag: `[RENDER_UI: {"component": "SalesDashboard", "args": {"type": "summary"}}]`\n'
    '   - Example: \'Aqui está o resumo financeiro de vendas: [RENDER_UI: {"component": "SalesDashboard", "args": {"type": "summary"}}]\'\n\n'
    "3. Transaction History / Sales list:\n"
    "   - When the user asks for sales transaction list, history, or recent orders:\n"
    '   - You MUST include this tag: `[RENDER_UI: {"component": "SalesDashboard", "args": {"type": "history"}}]`\n'
    '   - Example: \'Aqui estão as transações recentes: [RENDER_UI: {"component": "SalesDashboard", "args": {"type": "history"}}]\'\n\n'
    "## Rules:\n"
    "- ALWAYS use the exact tag format with double quotes for JSON strings.\n"
    "- Keep responses short and friendly."
)


def init_agent(checkpointer) -> Any:
    """Inicializa e compila o agente inteligente com ferramentas locais e checkpointer assíncrono."""
    global _agent

    _agent = create_deep_agent(
        model=get_llm(),
        system_prompt=SUPERVISOR_PROMPT,
        tools=[
            get_weather,
            remove_file,
            fetch_file,
            notify_email,
            
        ],
        subagents=[],
        name="supervisor",
        interrupt_on={
            "remove_file": True,  # Default: approve, edit, reject, respond
            "fetch_file": False,  # No interrupts needed
            "notify_email": {"allowed_decisions": ["approve", "reject"]},  # No editing
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
