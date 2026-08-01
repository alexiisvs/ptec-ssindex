# SSCatFacts

Monorepo con frontend React, backend FastAPI y PostgreSQL local. El entorno de
desarrollo se ejecuta completamente con Docker Compose.

## Servicios

- `postgres`: PostgreSQL 17 para desarrollo local.
- `migrations`: ejecuta `alembic upgrade head` y termina.
- `backend`: FastAPI con recarga automatica.
- `frontend`: React con Vite y recarga automatica.

El frontend usa Supabase Auth para registro, login, persistencia de sesion y
cierre de sesion. FastAPI valida los access tokens de Supabase antes de ejecutar
cualquier ruta protegida.

## Backend

El codigo del backend se divide en cuatro capas:

```text
api/             Endpoints, schemas y errores HTTP
application/     Casos de uso de usuarios, facts y likes
domain/          Entidades, reglas y contratos de repositorios
infrastructure/  PostgreSQL, SQLAlchemy y cliente de Cat Facts
```

Los endpoints protegidos reciben `Authorization: Bearer <access_token>`. El
backend valida firma, issuer, audience, expiracion, rol y UUID del usuario. Los
proyectos con llaves asimetricas usan JWKS con cache de 10 minutos; los proyectos
antiguos con HS256 se validan contra Supabase Auth.

## Supabase Auth

En el proyecto de Supabase, habilita el proveedor Email y desactiva la
confirmacion de correo para que el onboarding de la demo ocurra en un solo
paso. Copia la URL del proyecto y la clave publica `anon` en `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-publica-anon
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

La clave `anon` es publica y puede repetirse en ambas variables. Nunca uses la
clave `service_role` en el frontend ni para esta validacion. Reinicia backend y
frontend despues de modificar el archivo:

```bash
docker compose up --build -d backend frontend
```

La interfaz bloquea el formulario durante 15 minutos al completar cinco
intentos fallidos. Este bloqueo mejora el feedback local; la proteccion de
seguridad real sigue dependiendo del rate limit de Supabase.

## Frontend

La aplicacion usa React, TypeScript, Vite y Tailwind CSS. TanStack Query maneja
cache, paginacion y actualizaciones optimistas; React Hook Form y Zod validan los
formularios; Sonner muestra el resultado de las acciones.

Las rutas protegidas son:

- `/app/discover`: consulta un fact aleatorio y permite guardarlo.
- `/app/favorites`: lista paginada de facts guardados.
- `/app/popular`: ranking comunitario paginado.
- `/app/account`: consulta y actualizacion del perfil y cierre de sesion.

En escritorio se usa navegacion lateral y en pantallas pequenas una barra
inferior. Todas las consultas protegidas envian automaticamente el access token
de Supabase a FastAPI.

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
- Frontend: `npm ci` usando `package.json` y `package-lock.json`.

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
docker compose exec frontend npm run test
```

Las convenciones de API y codigo estan en
[`docs/conventions.md`](docs/conventions.md).

Los endpoints y el header temporal de desarrollo estan documentados en
[`docs/api.md`](docs/api.md).
