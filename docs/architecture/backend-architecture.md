# Backend Architecture

## Stack

The backend under `eye/backend/app/` is a layered FastAPI application with SQLAlchemy, Pydantic, and model utilities. It separates API route concerns from persistence, security, storage, and ML execution.

## Layers

- `app/main.py`: application startup, middleware, CORS, static mounting, and health entry points.
- `app/api/`: route definitions and endpoint groupings.
- `app/core/`: configuration, rate limiting, security, and middleware concerns.
- `app/db/`: database session and data access setup.
- `app/models/`: persistent entities for users, patients, screenings, reviews, and reports.
- `app/schemas/`: request and response validation models.
- `app/services/`: business logic for screening and clinical workflows.
- `app/storage/`: image and artifact persistence.
- `app/ml/`: classification, preprocessing, explainability, quality assessment, and evaluation helpers.

## API surface

The project exposes a modular router tree through `app/api/api.py`, which includes authentication, health, screening, patient, doctor review, report, and developer API route groups. This is aligned with the target architecture and keeps the application serviceable without a monolithic `main.py` endpoint file.

## Design decisions

- Route modules are grouped by domain (`auth`, `screening`, `report`, etc.) instead of a single flattened API file.
- Security controls are enforced centrally through auth dependencies and middleware rather than per-route ad hoc code.
- Storage and model access are configured through `Settings` rather than hard-coded paths.
- The application intentionally disables production defaults until required access-control and deployment checks are satisfied.

## Production improvement path

The current backend structure is already close to a production-ready service boundary. The next steps are to add stricter per-role authorization, scoped patient data access, explicit audit trails, and environment gating for deployments.
