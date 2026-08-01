# API local

Base URL: `http://localhost:8000/api/v1`

Los endpoints protegidos reciben el access token de Supabase mediante
`Authorization: Bearer <access_token>`. El backend obtiene el UUID exclusivamente
del claim `sub` despues de validar el JWT.

## Endpoints

- `GET /health/live`
- `GET /health/ready`
- `GET /api/v1/usernames/{username}/availability`
- `GET /api/v1/me`
- `PUT /api/v1/me/profile`
- `GET /api/v1/facts/random`
- `PUT /api/v1/facts/{id}/like`
- `DELETE /api/v1/facts/{id}/like`
- `GET /api/v1/me/likes?page=1&page_size=20`
- `GET /api/v1/facts/popular?page=1&page_size=20`

Ejemplo para crear un perfil local:

```bash
curl -X PUT http://localhost:8000/api/v1/me/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -d '{"username":"demo_user"}'
```

La disponibilidad de username y los healthchecks son publicos. Las demas rutas
rechazan tokens ausentes, expirados, alterados o emitidos para otro proyecto.

Los errores responden con:

```json
{
  "code": "machine_readable_code",
  "message": "Human-readable message",
  "request_id": "uuid",
  "details": {}
}
```
