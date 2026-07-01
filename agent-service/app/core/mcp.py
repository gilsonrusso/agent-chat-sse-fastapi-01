import logging
import os
from typing import Any
from mcp.client.session import ClientSession
from mcp.client.sse import sse_client
from langchain_mcp_adapters.tools import load_mcp_tools

logger = logging.getLogger(__name__)


class MCPConnectionManager:
    """
    Gerenciador de conexão persistente com o servidor MCP (Server-Sent Events).
    Responsável por inicializar a conexão no lifespan do FastAPI, expor as ferramentas
    e realizar o encerramento seguro.
    """

    def __init__(self, url: str = os.getenv("MCP_URL", "http://localhost:8001/sse")):
        self.url = url
        self.session: ClientSession | None = None
        self.client_ctx: Any = None
        self.tools: list[Any] = []

    async def connect(self):
        try:
            logger.info(f"Conectando ao servidor MCP SSE em {self.url}...")
            # Entra no contexto do SSE client
            self.client_ctx = sse_client(self.url)
            read_stream, write_stream = await self.client_ctx.__aenter__()
            
            # Inicializa a sessão MCP
            self.session = ClientSession(read_stream, write_stream)
            await self.session.__aenter__()
            await self.session.initialize()

            # Converte todas as ferramentas MCP em StructuredTools do LangChain
            self.tools = await load_mcp_tools(self.session)
            logger.info(f"Carregadas {len(self.tools)} ferramentas do MCP com sucesso!")
        except Exception as e:
            logger.warning(
                f"Erro ao conectar ao MCP Server {self.url}: {e}. "
                "O agente principal continuará sem as ferramentas de Produto e Vendas."
            )
            self.tools = []

    async def disconnect(self):
        logger.info("Encerrando conexão com o servidor MCP...")
        try:
            if self.session:
                await self.session.__aexit__(None, None, None)
            if self.client_ctx:
                await self.client_ctx.__aexit__(None, None, None)
            logger.info("Conexão MCP finalizada com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao encerrar a conexão MCP: {e}")


mcp_manager = MCPConnectionManager()
