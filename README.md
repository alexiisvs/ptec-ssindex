# SSCatFacts

Monorepo con frontend React, backend FastAPI y PostgreSQL local. El entorno de
desarrollo se ejecuta completamente con Docker Compose.

## Servicios

- `postgres`: PostgreSQL 17 para desarrollo local.
- `migrations`: ejecuta `alembic upgrade head` y termina.
- `backend`: FastAPI con recarga automatica.
- `frontend`: React con Vite y recarga automatica.

Supabase se incorporara en la rama de autenticacion. Esta etapa no configura
usuarios ni login.

## Backend

El codigo del backend se divide en cuatro capas:

```text
api/             Endpoints, schemas y errores HTTP
application/     Casos de uso de usuarios, facts y likes
domain/          Entidades, reglas y contratos de repositorios
infrastructure/  PostgreSQL, SQLAlchemy y cliente de Cat Facts
```

Hasta integrar Supabase Auth, los endpoints protegidos usan el header temporal
`X-User-ID` con un UUID.

## Setup

Abre Ubuntu/WSL y entra al repositorio:

```bash
cd /mnt/c/Users/alexi/Desktop/Trabajo/ptec-ssindex
```

Crea la configuracion local la primera vez:

```bash
cp -n .env.example .env
```

Construye y levanta el entorno:

```bash
docker compose up --build -d
```

El orden de inicio es PostgreSQL, migraciones, backend y frontend. Revisa el
estado y los logs con:

```bash
docker compose ps
docker compose logs -f
```

El contenedor `migrations` debe aparecer con estado `Exited (0)`, porque termina
despues de aplicar las migraciones. Los otros tres deben quedar saludables.

Servicios disponibles:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`
- Backend live: `http://localhost:8000/health/live`
- Backend ready: `http://localhost:8000/health/ready`
- PostgreSQL local: `localhost:5433`

## Uso diario

El codigo en `frontend/src`, `backend/src`, `backend/tests` y las migraciones
esta montado como volumen. Los cambios normales se recargan automaticamente.

```bash
# Pausar y reanudar
docker compose pause
docker compose unpause

# Apagar y eliminar contenedores sin borrar la base
docker compose down

# Volver a levantar usando las imagenes existentes
docker compose up -d

# Reconstruir despues de cambiar requirements, package.json o Dockerfiles
docker compose up --build -d
```

Los datos de PostgreSQL se conservan en el volumen `postgres_data`. Para borrar
completamente la base local y comenzar de cero:

```bash
docker compose down -v
docker compose up --build -d
```

El primer comando elimina los datos locales de forma irreversible.

## Dependencias

Docker instala las dependencias al construir las imagenes:

- Backend: `pip install -r requirements.txt`.
- Frontend: `npm install` usando `package.json`.

Existe un solo archivo `backend/requirements.txt`. Docker reutiliza su cache
mientras ese archivo no cambie.

## Migraciones

Alembic aplica las migraciones automaticamente al levantar el entorno. Para
crear una migracion nueva despues de modificar modelos:

```bash
docker compose run --rm backend alembic revision --autogenerate -m "descripcion"
docker compose run --rm migrations
```

La migracion inicial es una linea base vacia; las tablas de negocio se agregaran
en la rama del core del backend.

## Calidad

Con los contenedores levantados:

```bash
docker compose exec backend ruff check src tests migrations
docker compose exec backend mypy src tests
docker compose exec backend pytest
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
```

Las convenciones de API y codigo estan en
[`docs/conventions.md`](docs/conventions.md).

Los endpoints y el header temporal de desarrollo estan documentados en
[`docs/api.md`](docs/api.md).
