FROM python:3.12-slim AS dependencies

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM dependencies AS development

COPY alembic.ini pyproject.toml ./
COPY migrations ./migrations
COPY src ./src
COPY tests ./tests

EXPOSE 8000

CMD ["uvicorn", "sscatfacts.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM dependencies AS production

COPY alembic.ini ./
COPY migrations ./migrations
COPY src ./src

EXPOSE 8000

CMD ["uvicorn", "sscatfacts.main:app", "--app-dir", "src", "--host", "0.0.0.0", "--port", "8000"]
