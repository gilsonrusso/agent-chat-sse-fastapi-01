FROM python:3.12-slim

# Instalar uv para gerenciamento rápido de dependências
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Instalar pacotes do sistema necessários para compilação do driver PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar dependências e lock file
COPY pyproject.toml uv.lock* ./

# Sincronizar dependências criando o venv
RUN uv sync --no-dev --frozen 2>/dev/null || uv sync --no-dev

# Copiar código-fonte
COPY . .

EXPOSE 8000

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Executar usando o venv criado pelo uv sync
CMD [".venv/bin/fastapi", "run", "app/main.py", "--port", "8000", "--host", "0.0.0.0"]
