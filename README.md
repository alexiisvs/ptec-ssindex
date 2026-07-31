# SSCatFacts

Monorepo para una aplicacion de descubrimiento y favoritos de datos sobre gatos.
El frontend usa React y el backend expone una API con FastAPI. Supabase proveera
autenticacion y PostgreSQL.

## Estructura

```text
backend/   API y logica de negocio
frontend/  Aplicacion web
docs/      Convenciones y decisiones tecnicas
scripts/   Comandos comunes para Windows y Unix
```

## Requisitos

- Node.js 22+
- Python 3.12+
- Docker Desktop con Docker Compose

## Configuracion inicial

1. Copia `.env.example` como `.env` y completa los valores de tu proyecto de
   Supabase.
2. Ejecuta `./scripts/bootstrap.ps1` en PowerShell.
3. Levanta el entorno con `./scripts/dev.ps1`.

Frontend: `http://localhost:5173`

Backend: `http://localhost:8000`

Documentacion OpenAPI: `http://localhost:8000/docs`

## Calidad

Ejecuta `./scripts/check.ps1` para correr lint, formato en modo verificacion y
typecheck de ambos proyectos.

Las convenciones del proyecto estan documentadas en
[`docs/conventions.md`](docs/conventions.md).
