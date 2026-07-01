FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock* ./

RUN uv sync --no-dev --frozen 2>/dev/null || uv sync --no-dev

COPY . .

EXPOSE 8002

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD [".venv/bin/fastapi", "run", "app/main.py", "--port", "8002", "--host", "0.0.0.0"]
