# API Endpoint Reference

## Health and system endpoints

- `GET /api/health`: system status and model readiness summary
- `GET /`: service metadata and API-prefix reference

## Authentication endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`

## Screening workflow

- `POST /api/screenings/upload`
- `POST /api/screenings/{screening_id}/analyze`
- `GET /api/screenings/{screening_id}`
- `GET /api/screenings`
- `POST /api/screenings/{screening_id}/quality`
- `POST /api/screenings/{screening_id}/explain`

## Clinical review and reports

- `POST /api/screenings/{screening_id}/review`
- `GET /api/screenings/{screening_id}/review`
- `GET /api/screenings/{screening_id}/report`

## Patient and developer routes

- `GET /api/patients`
- `POST /api/patients`
- `GET /api/developer/usage`
- `POST /api/developer/keys`
- `GET /api/developer/keys`
- `DELETE /api/developer/keys/{key_id}`

## Contract expectations

These endpoints are grouped by domain and documented in the backend route modules. The backend uses Pydantic schemas, API-level validation, and model checks to keep the request/response contracts explicit without duplicating logic across the app.
