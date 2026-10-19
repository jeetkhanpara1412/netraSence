# Integration Guide

## Frontend to backend

The React frontend communicates with the FastAPI backend through the application service layer and a consistent base API URL. The app keeps the API contract in a single place instead of scattering fetch logic across every page.

## Local dev setup

1. Start the backend with uvicorn on port 8000.
2. Start the Vite frontend on port 3000.
3. Use the same-origin or configured `VITE_API_URL` to route requests.
4. Sign in with an administrator or clinician account before using image upload and screening routes.

## Key integration rules

- Do not embed patient data into browser storage beyond normal session patterns.
- Treat the backend as the source of truth for screening data, reports, and model readiness.
- Keep medical findings in backend responses and never infer them from browser-only state.
- Validate unauthenticated access to patient and screening resources before exposing them to the UI.

## Example flow

- clinician signs in
- file is uploaded to `/api/screenings/upload`
- backend persists metadata and image asset
- model analysis returns classification and quality assessment
- clinician review or report is fetched using the screening ID

## Production readiness

This flow is suitable for a controlled research environment, but a production deployment should add patient-scoped authorization, signed storage links, and full audit logging before exposure beyond a closed clinical environment.
