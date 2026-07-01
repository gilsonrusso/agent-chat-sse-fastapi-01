from typing import Any
from deepagents import create_deep_agent
from app.core.llm import get_llm
from app.tools import get_weather, remove_file, fetch_file, notify_email

from app.core.mcp import mcp_manager

# O agente principal será inicializado tardiamente (dentro do lifespan)
_agent = None

SUPERVISOR_PROMPT = (
    "You are a helpful personal assistant and routing supervisor.\n\n"
    "## Role\n"
    "- You converse directly with the user for general questions and casual chat.\n"
    "- You delegate specialized tasks to domain experts using the task tool when needed.\n\n"
    "## Routing Rules\n"
    "1. If the request involves calendar, scheduling, emails, weather, files, or notifications, "
    "or general chat, solve it yourself using your native tools.\n"
    "2. If the request involves product catalog, inventory, or prices, delegate to the products expert.\n"
    "3. If the request involves sales data, revenue, or transaction history, delegate to the sales expert.\n\n"
    "## Output Rules\n"
    "- Always summarize the expert's findings to the user in a clear, friendly manner.\n"
    "- Do NOT expose internal routing decisions or tool names to the user.\n"
    "- Keep responses concise and actionable."
)


def init_agent(checkpointer) -> Any:
    """Inicializa e compila o agente inteligente supervisor com subagentes MCP e checkpointer assíncrono."""
    global _agent

    mcp_tools = mcp_manager.tools
    
    # Filtra as ferramentas remotas do MCP correspondentes aos domínios de produtos e vendas
    products_tools = [t for t in mcp_tools if "products" in t.name]
    sales_tools = [t for t in mcp_tools if "sales" in t.name]
    
    subagents = []

    if products_tools:
        subagents.append(
            {
                "name": "products_agent",
                "description": "Consult product catalog, inventory, and prices. Use for finding items to buy.",
                "system_prompt": (
                    "You are a product catalog specialist.\n\n"
                    "## Capabilities\n"
                    "- Use tool list_products_products to retrieve the catalog of products.\n"
                    "- Use tool get_product_products_details_get to get details for a specific product ID.\n\n"
                    "## Output Rules\n"
                    "- Present product details and prices clearly.\n"
                    "- Keep answers under 300 words."
                ),
                "tools": products_tools,
            }
        )

    if sales_tools:
        subagents.append(
            {
                "name": "sales_agent",
                "description": "Analyze sales history, revenue, and transaction metrics.",
                "system_prompt": (
                    "You are a sales performance analyst.\n\n"
                    "## Capabilities\n"
                    "- Use list_sales_sales tool to retrieve sales transactions history.\n"
                    "- Use get_sales_summary_sales_summary_get tool to get consolidated revenue and volume metrics.\n\n"
                    "## Output Rules\n"
                    "- Provide clear revenue and volume metrics summaries.\n"
                    "- Keep answers under 300 words."
                ),
                "tools": sales_tools,
            }
        )

    _agent = create_deep_agent(
        model=get_llm(),
        system_prompt=SUPERVISOR_PROMPT,
        tools=[get_weather, remove_file, fetch_file, notify_email],
        subagents=subagents,
        name="supervisor",
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
