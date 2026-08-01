# API local

Base URL: `http://localhost:8000/api/v1`

Hasta integrar Supabase Auth, los endpoints protegidos reciben un UUID mediante
el header `X-User-ID`. La rama de autenticacion reemplazara esta dependencia por
el JWT sin cambiar los endpoints ni los casos de uso.

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
  -H "X-User-ID: 11111111-1111-4111-8111-111111111111" \
  -d '{"username":"demo_user"}'
```

Los errores responden con:

```json
{
  "code": "machine_readable_code",
  "message": "Human-readable message",
  "request_id": "uuid",
  "details": {}
}
```
