import os
import sys
import time
import httpx
from fastmcp import FastMCP

openapi_spec = None

# 1. Tentar importar o app FastAPI para gerar o OpenAPI spec de forma estática
try:
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend"))
    sys.path.insert(0, backend_path)
    # Tenta definir a variável de ambiente para que as configurações carreguem corretamente
    os.environ["ENV_FILE"] = os.path.join(backend_path, ".env")
    
    from app.main import app as backend_app
    openapi_spec = backend_app.openapi()
    print("OpenAPI spec carregada com sucesso do código-fonte.")
except Exception as e:
    print(f"Não foi possível carregar o schema OpenAPI de forma estática: {e}")

backend_url = os.getenv("BACKEND_URL", "http://localhost:8002")

# 2. Se falhar, tentar buscar via requisição HTTP do backend ativo (polling por até 5 segundos)
if not openapi_spec:
    print(f"Tentando buscar o schema via HTTP em {backend_url}/openapi.json...")
    for _ in range(5):
        try:
            response = httpx.get(f"{backend_url}/openapi.json", timeout=2.0)
            if response.status_code == 200:
                openapi_spec = response.json()
                print("OpenAPI spec obtida via HTTP com sucesso!")
                break
        except Exception:
            time.sleep(1.0)

# 3. Se tudo falhar, usar um schema vazio de fallback para evitar quebra de boot do servidor MCP
if not openapi_spec:
    print("Aviso: Utilizando schema OpenAPI de fallback (vazio). Certifique-se de que o backend está ativo.")
    openapi_spec = {
        "openapi": "3.0.0",
        "info": {"title": "E-Commerce API Fallback", "version": "0.1.0"},
        "paths": {}
    }

# Cliente HTTP configurado para enviar as requisições ao backend de e-commerce
client = httpx.AsyncClient(base_url=backend_url)

# Criação do servidor MCP a partir do schema OpenAPI obtido
mcp = FastMCP.from_openapi(
    openapi_spec=openapi_spec,
    client=client,
    name="E-Commerce API MCP Server"
)

# Exposição via app ASGI HTTP com transporte SSE
app = mcp.http_app(transport="sse")

if __name__ == "__main__":
    import uvicorn
    # Executa o servidor MCP na porta 8001
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
