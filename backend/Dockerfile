FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src

RUN python -m venv .venv \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -e .

FROM base AS development

RUN pip install --no-cache-dir -e ".[dev]"

EXPOSE 8000

CMD ["uvicorn", "sscatfacts.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS production

EXPOSE 8000

CMD ["uvicorn", "sscatfacts.main:app", "--host", "0.0.0.0", "--port", "8000"]
