# Frontend Architecture

## Stack and purpose

The frontend in `eye/src/` is a Vite React application that keeps the original two-page clinician workflow intact while introducing a maintainable UI shell around it. The app is intentionally not rebuilt from scratch; instead, it keeps the existing visual design and clinical review behavior while grouping responsibilities into page-level modules and reusable services.

## Main responsibilities

- `App.tsx`: top-level shell, navigation state, auth dialog state, backend health check, UI scaling, and route switching.
- `components/`: shared UI such as navbars, dialogs, cards, and visual widgets.
- `pages/DoctorDashboard/`: imaging, upload, quality checks, and screening workflow.
- `pages/ReportPage/`: clinical report review page.
- `services/api/`: request wrappers, error handling, and typed API clients.
- `store/`, `hooks/`, and `utils/`: cross-cutting state and logic helpers.

## Architectural approach

The frontend follows a feature-oriented, page-first structure rather than a deeply nested abstraction trap. This is a good fit for a surgical clinical tool because it preserves the working UI while supporting future extraction of patient, reporting, and screening modules without forcing a large rewrite.

## Observed strengths

- The app retains a single authoritative screen flow for dashboard and report views.
- Health and authentication state are centralized in `App.tsx`.
- The backend API is abstracted behind a dedicated service layer rather than inline fetch calls.
- The UI scale and access control are handled in a lightweight, predictable way.

## Operational considerations

- Keep authentication and real-image upload behind the same guardrail: signed-in clinician/admin sessions only.
- Avoid embedding secrets or model details into browser bundles.
- Continue to treat the frontend as a presentation layer for the backend's validated workflow and not as a source of truth for clinical decisions.
