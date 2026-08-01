$ErrorActionPreference = "Stop"

npm --prefix frontend run lint
npm --prefix frontend run format:check
npm --prefix frontend run typecheck

Push-Location backend
try {
    & .venv/Scripts/python.exe -m ruff check src tests
    & .venv/Scripts/python.exe -m ruff format --check src tests
    & .venv/Scripts/python.exe -m mypy src tests
}
finally {
    Pop-Location
}
