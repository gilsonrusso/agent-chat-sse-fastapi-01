from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/products", tags=["products"])


class Product(BaseModel):
    id: int
    name: str = Field(description="O nome do produto")
    price: float = Field(description="O preço unitário do produto")


# Dados mockados
PRODUCTS = [
    {"id": 1, "name": "Laptop Pro", "price": 1200.0},
    {"id": 2, "name": "Mouse Sem Fio", "price": 25.0},
    {"id": 3, "name": "Monitor 4K", "price": 450.0},
]


@router.get("/", response_model=list[Product])
async def list_products():
    """
    Retorna a lista completa de produtos disponíveis no catálogo da loja.
    Use esta ferramenta quando o usuário perguntar quais produtos vendemos,
    quais são as opções disponíveis ou para consultar preços gerais.
    """
    return PRODUCTS


@router.get("/details", response_model=Product)
async def get_product(product_id: int):
    """
    Busca os detalhes técnicos e o preço de um produto específico através do seu ID único (product_id).
    Use esta ferramenta quando o usuário já tiver um ID de produto e precisar confirmar
    o nome exato ou o preço atual.
    """
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado no sistema")
    return product
