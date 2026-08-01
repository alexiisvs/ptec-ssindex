# SSCatFacts

Aplicacion web para descubrir facts de gatos, guardarlos como favoritos y ver
los mas populares. El proyecto incluye un frontend React, una API FastAPI y una
base de datos PostgreSQL.

## Arquitectura

- **Frontend:** React, TypeScript, Vite y Tailwind CSS.
- **Backend:** FastAPI, SQLAlchemy y Alembic.
- **Autenticacion:** Supabase Auth con email y password.
- **Base de datos:** PostgreSQL 17 ejecutado localmente con Docker.
- **Datos externos:** `catfact.ninja` para obtener facts aleatorios.

Supabase se usa solamente para registro, login y sesiones. FastAPI valida el
JWT de Supabase en las rutas protegidas y guarda perfiles, facts y likes en el
PostgreSQL local.

El backend separa endpoints, casos de uso, reglas de dominio e infraestructura.
Los facts se normalizan y se identifican mediante SHA-256 para no almacenarlos
duplicados. Si Cat Facts no responde, la API intenta usar un fact previamente
guardado. Los likes son idempotentes y tambien representan los favoritos.

## Configuracion

En Supabase debe estar habilitado el proveedor Email y deshabilitada la opcion
**Confirm email** para que el registro entregue una sesion inmediatamente.

Crea el archivo de variables desde el ejemplo:

```bash
cp .env.example .env
```

Las variables principales son:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-publica
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
CAT_FACT_URL=https://catfact.ninja
```

## Levantar el entorno

Desde Ubuntu/WSL, entra al repositorio y levanta todos los servicios:

```bash
cd /mnt/c/Users/alexi/Desktop/Trabajo/ptec-ssindex
docker compose up --build -d
```

Docker instala las dependencias, crea PostgreSQL, ejecuta las migraciones y
levanta backend y frontend. El servicio `migrations` termina con `Exited (0)`
cuando las tablas fueron creadas correctamente.

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentacion API: http://localhost:8000/docs
- PostgreSQL: `localhost:5433`

Revisar estado y logs:

```bash
docker compose ps
docker compose logs -f
```

Detener y volver a levantar:

```bash
docker compose down
docker compose up -d
```

Los datos permanecen en un volumen de Docker. `docker compose down -v` elimina
la base local y debe usarse solamente cuando se quiera comenzar desde cero.

## Verificacion

Con los contenedores levantados:

```bash
docker compose exec backend pytest
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run test
docker compose exec frontend npm run build
```
