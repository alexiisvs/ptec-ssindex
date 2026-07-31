# Convenciones del proyecto

## API HTTP

- Los endpoints de negocio usan el prefijo `/api/v1`.
- Los healthchecks se mantienen fuera del prefijo: `/health/live` y
  `/health/ready`.
- Los cuerpos JSON, query parameters y nombres de campos usan `snake_case`.
- Las fechas se representan en UTC usando ISO 8601.
- Las colecciones paginadas responden con `items`, `total`, `page` y
  `page_size`.
- Los errores usan siempre esta estructura:

```json
{
  "code": "machine_readable_code",
  "message": "Mensaje legible",
  "request_id": "uuid",
  "details": {}
}
```

## Variables de entorno

- `.env` contiene valores locales y nunca se versiona.
- `.env.example` contiene todas las variables requeridas, sin credenciales
  reales.
- Solo las variables con prefijo `VITE_` pueden llegar al navegador.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` y `DIRECT_DATABASE_URL` son
  secretos exclusivos del backend.
- Se agrega una variable nueva a `.env.example` en el mismo cambio que comienza
  a utilizarla.

## Codigo y Git

- Python se formatea y valida con Ruff; mypy se ejecuta en modo estricto.
- TypeScript se valida con ESLint, Prettier y `tsc` en modo estricto.
- Las ramas usan prefijos como `chore/`, `feat/`, `fix/` y `docs/`.
- Los commits siguen Conventional Commits.
