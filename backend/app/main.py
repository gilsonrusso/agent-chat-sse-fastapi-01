from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.products import router as products_router
from app.api.sales import router as sales_router

app = FastAPI(title="E-Commerce Backend API", version="0.1.0")

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products_router)
app.include_router(sales_router)

if __name__ == "__main__":
    import uvicorn
    # Roda por padrão na porta 8002 para não conflitar com a porta 8000 do agent-service
    uvicorn.run(app, host="0.0.0.0", port=8002)
