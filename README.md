# SSCatFacts

Monorepo con frontend React, backend FastAPI y Supabase para autenticacion y
PostgreSQL. El entorno local se ejecuta completamente con Docker Compose.

## Estructura

```text
backend/   API, requirements y configuracion Python
frontend/  Aplicacion React
docs/      Convenciones del proyecto
scripts/   Comandos auxiliares para PowerShell
```

## Requisito

Docker con Docker Compose disponible en Ubuntu/WSL. No necesitas instalar
Python, Node ni PostgreSQL localmente para ejecutar el proyecto.

## Setup

Abre Ubuntu/WSL y entra al repositorio:

```bash
cd /mnt/c/Users/alexi/Desktop/Trabajo/ptec-ssindex
```

Crea el archivo de configuracion la primera vez:

```bash
cp -n .env.example .env
nano .env
```

Completa en `.env` la URL, clave publica y cadena PostgreSQL de tu proyecto de
Supabase. Luego construye y levanta backend y frontend juntos:

```bash
docker compose up --build -d
```

El frontend espera a que el backend este saludable antes de iniciar. Revisa el
estado y los logs con:

```bash
docker compose ps
docker compose logs -f
```

Para salir de los logs presiona `Ctrl+C`; los servicios continuaran levantados.

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`
- Healthcheck: `http://localhost:8000/health/live`

## Uso diario

Apaga y elimina los contenedores para liberar CPU y memoria:

```bash
docker compose down
```

Las imagenes quedan guardadas en disco. Para volver a levantar el proyecto sin
reinstalar todo:

```bash
docker compose up -d
```

`docker compose down` es suficiente para que esta aplicacion no consuma CPU ni
memoria. Si Docker fue instalado directamente en Ubuntu y tambien quieres
apagar su servicio, usa:

```bash
sudo service docker stop
sudo service docker start
```

El segundo comando vuelve a iniciar Docker antes del proximo `docker compose
up`. Si usas Docker Desktop, el equivalente es cerrar y volver a abrir Docker
Desktop.

Si cambiaste `backend/requirements.txt`, `frontend/package.json` o un
Dockerfile, reconstruye las imagenes:

```bash
docker compose up --build -d
```

## Dependencias

Docker instala las dependencias durante la construccion de cada imagen:

- El backend ejecuta `pip install -r requirements.txt` desde
  `backend/Dockerfile`.
- El frontend ejecuta `npm install` desde `frontend/Dockerfile`.

Docker guarda estas capas en cache. Mientras los archivos de dependencias no
cambien, los siguientes arranques reutilizan la instalacion anterior. Hay un
solo archivo `backend/requirements.txt` con dependencias de aplicacion y
desarrollo.

## Calidad

Con los contenedores levantados puedes ejecutar:

```bash
docker compose exec backend ruff check src tests
docker compose exec backend mypy src tests
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
```

Las convenciones de API y codigo estan en
[`docs/conventions.md`](docs/conventions.md).
