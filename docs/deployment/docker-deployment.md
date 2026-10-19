# Docker Deployment Notes

## Current status

The repository includes Docker assets and Compose-based deployment support. This is useful for local reproducibility, but it is not a production deployment recommendation. The configuration is still designed around development workflows and the explicit security guardrails described in the project documentation.

## Useful files

- `eye/docker-compose.yml`
- `eye/Dockerfile.frontend`
- `eye/backend/Dockerfile`
- `.env.example`

## Deployment intent

The Compose flow supports a local database and app startup sequence, while the application continues to enforce the requirement that production-mode settings remain disabled until patient access controls and secure environment configuration are implemented.

## Operational caution

Do not treat Docker Compose as a security boundary for patient data or a replacement for a governed clinical environment. Containerization helps reproducibility, but the project still requires access-control review, audit logging, and a validated model governance process before broader usage.
