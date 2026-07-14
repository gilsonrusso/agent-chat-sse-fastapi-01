from langchain.tools import tool

# Mock Data
PRODUCTS = [
    {"id": 1, "name": "Laptop Pro", "price": 1200.0},
    {"id": 2, "name": "Mouse Sem Fio", "price": 25.0},
    {"id": 3, "name": "Monitor 4K", "price": 450.0},
]

SALES_HISTORY = [
    {"id": 500, "product_name": "Laptop Pro", "quantity": 1, "total_value": 1200.0},
    {"id": 501, "product_name": "Mouse Sem Fio", "quantity": 2, "total_value": 50.0},
]


@tool
def get_weather(city: str) -> str:
    """Get weather for a city."""
    return f"It's always sunny in {city}!"


@tool
def remove_file(path: str) -> str:
    """Delete a file from the filesystem."""
    return f"Deleted {path}"


@tool
def fetch_file(path: str) -> str:
    """Read a file from the filesystem."""
    return f"Contents of {path}"


@tool
def notify_email(to: str, subject: str, body: str) -> str:
    """Send an email."""
    return f"Sent email to {to}"


@tool
def list_products() -> list[dict]:
    """Retorna a lista completa de produtos disponíveis no catálogo da loja."""
    return PRODUCTS


@tool
def get_product(product_id: int) -> dict | str:
    """Busca os detalhes técnicos e o preço de um produto específico através do seu ID único (product_id)."""
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return f"Produto {product_id} não encontrado no sistema"
    return product


@tool
def list_sales() -> list[dict]:
    """Recupera o histórico completo de transações e vendas realizadas."""
    return SALES_HISTORY


@tool
def get_sales_summary() -> dict:
    """Gera um relatório consolidado com o faturamento total (revenue) e o volume (count) de vendas."""
    total = sum(sale["total_value"] for sale in SALES_HISTORY)
    return {"total_revenue": total, "total_sales_count": len(SALES_HISTORY)}
