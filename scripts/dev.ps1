$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
    throw "Falta .env. Crea uno a partir de .env.example antes de continuar."
}

docker compose up --build
