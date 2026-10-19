# System Overview

## Purpose

NetraSense is a research-focused diabetic-retinopathy screening prototype that combines a browser-based clinician workstation with a FastAPI backend and a PyTorch grading pipeline. The current implementation is intentionally limited to a prototype workflow: it supports image upload, model analysis, clinician review, and report generation for the supplied IDRiD dataset, but it does not claim clinical validation or production-grade deployment readiness.

## Live architecture

- Frontend: `eye/src/` built with Vite + React + TypeScript
- Backend: `eye/backend/app/` built with FastAPI + SQLAlchemy + Pydantic
- Local persistence: SQLite by default for local development
- Storage: `eye/backend/storage/` for uploaded and generated files
- ML pipeline: `eye/backend/app/ml/` with preprocessing, classification, explainability, and quality utilities
- Datasets: `SIHDatasets/` with non-trivial real-image sources and licensing obligations

## Runtime flow

1. The clinician signs in through the frontend (`eye/src/App.tsx` and auth-related components).
2. A fundus image is uploaded to the backend screening endpoint.
3. The backend validates upload constraints and stores the image in the configured storage directory.
4. The screening record is created in the SQLAlchemy database.
5. The DR grading pipeline is triggered and the model checkpoint is loaded from the configured `MODEL_PATH`.
6. Results and explainability artifacts are returned to the clinician review workflow.
7. Review and report endpoints persist clinician overrides or generated reports.

## Real constraints

This web application is intentionally designed to refuse unsafe production defaults:

- `ALLOW_SQLITE_FALLBACK` is disabled except in development.
- `CORS_ORIGINS` is constrained to localhost origins.
- `ENVIRONMENT == "production"` raises a configuration error until key access-control gaps are resolved.
- The application keeps the classification model and retinal-vessel dataset separated and does not mix those pipelines.

## Refactoring outcome

The codebase is already organized around the correct domain boundaries: frontend pages, backend API routes, database models, ML logic, and storage. The remaining work is documentation, deployment guardrails, and controlled operational validation rather than a wholesale rewrite.
