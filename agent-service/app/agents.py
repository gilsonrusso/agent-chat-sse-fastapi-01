from typing import Any

from deepagents import create_deep_agent

from app.core.llm import get_llm
from app.tools import (
    fetch_file,
    get_product,
    get_sales_summary,
    get_weather,
    list_products,
    list_sales,
    notify_email,
    remove_file,
)

# O agente principal será inicializado tardiamente (dentro do lifespan)
_agent = None

SUPERVISOR_PROMPT = (
    "You are a helpful personal assistant.\n\n"
    "CRITICAL: You MUST NOT output plain text lists, markdown bullet points, or markdown tables for products, catalog items, or sales reports. Instead, you MUST represent them visually by generating a dynamic layout tag:\n"
    "`[RENDER_LAYOUT: <JSON_SCHEMA>]`\n\n"
    "### JSON Layout DSL Schema:\n"
    "The client will parse this JSON and build MUI widgets recursively. You MUST use this exact structure:\n"
    "1. Container:\n"
    '   `{"type": "container", "orientation": "vertical" | "horizontal", "spacing": number, "children": [nodes]}`\n'
    "2. Text:\n"
    '   `{"type": "text", "value": "Your text here", "variant": "h5" | "h6" | "subtitle1" | "body2", "color": "primary" | "success" | "text.secondary" | string}`\n'
    "3. Card:\n"
    '   `{"type": "card", "title": "Card Title", "value": "Main Card Value (e.g. Price, Total)", "icon": "product" | "money" | "history" | "sales" | "trend", "chip": "optional label", "children": [optional nested nodes]}`\n'
    "4. Grid:\n"
    '   `{"type": "grid", "spacing": number, "children": [nodes]}`\n'
    "5. Button (interactive action button):\n"
    '   `{"type": "button", "label": "Button Text", "action": "purchase" | "details", "params": {"id": number, "name": string}}`\n\n'
    "### Examples of Expected Tags:\n"
    "- Catalog Grid Example:\n"
    '  `[RENDER_LAYOUT: {"type": "grid", "spacing": 2, "children": [{"type": "card", "title": "Laptop Pro", "value": "R$ 4500.00", "icon": "product", "chip": "Em Estoque", "children": [{"type": "button", "label": "Simular Compra", "action": "purchase", "params": {"id": 1, "name": "Laptop Pro"}}]}]}]`\n'
    "- Summary Row Example:\n"
    '  `[RENDER_LAYOUT: {"type": "container", "orientation": "horizontal", "spacing": 2, "children": [{"type": "card", "title": "Total Faturamento", "value": "R$ 1250.00", "icon": "money"}]}]`\n\n'
    "### Strict Guidelines:\n"
    "1. For catalog/products: Call `list_products` first. Then, generate the `[RENDER_LAYOUT: ...]` tag containing a `grid` of product `card`s. Each card must have: `title` equal to product name, `value` with the price (formatted as currency), `icon` set to 'product', and a child `button` with `label` 'Simular Compra', `action` 'purchase', and `params` as the product info. Do NOT write list text.\n"
    "2. For sales summary/KPIs: Call `get_sales_summary` first. Then, generate the `[RENDER_LAYOUT: ...]` tag containing a horizontal `container` of metrics `card`s (with `icon` set to 'money' or 'trend'). Do NOT write text summary.\n"
    "3. For recent sales history: Call `list_sales` first. Then, generate the `[RENDER_LAYOUT: ...]` tag containing a vertical `container` of transaction `card`s (with `icon` set to 'history' or 'sales'). Do NOT write list text.\n"
    "4. ALWAYS make sure the JSON inside `[RENDER_LAYOUT: ...]` is completely valid, syntactically correct, has no unclosed braces, and no trailing commas."
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
            list_products,
            get_product,
            list_sales,
            get_sales_summary,
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
