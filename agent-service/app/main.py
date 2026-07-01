from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.agents import init_agent
from app.core.connections import connection_pool
from app.core.logger import logger
from app.core.mcp import mcp_manager
from app.db.database import Base, engine
from app.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up the server (Lifespan)")

    # 1. Conectar ao servidor MCP
    await mcp_manager.connect()

    # 2. Abrir o pool de conexões do checkpointer e criar as tabelas necessárias
    await connection_pool.open()
    checkpointer = AsyncPostgresSaver(connection_pool)
    await checkpointer.setup()

    # 3. Inicializar e compilar o agente inteligente LangGraph
    init_agent(checkpointer)

    # 4. Criar tabelas da aplicação no banco de dados se não existirem
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    logger.info("Shutting down the server (Lifespan)")
    # 5. Fechar o pool de conexões com segurança ao encerrar
    await connection_pool.close()

    # 6. Desconectar do servidor MCP
    await mcp_manager.disconnect()


app = FastAPI(lifespan=lifespan)

# Configuração de middlewares CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão do roteador de rotas da aplicação
app.include_router(api_router)
