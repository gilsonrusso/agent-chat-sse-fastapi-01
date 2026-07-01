from psycopg_pool import AsyncConnectionPool
from app.core.config import settings

# Pool de Conexões assíncronas para o PostgreSQL (usado pelo checkpointer do LangGraph)
connection_pool = AsyncConnectionPool(
    conninfo=settings.DATABASE_URL,
    max_size=10,
    kwargs={"autocommit": True},
    open=False,
)
