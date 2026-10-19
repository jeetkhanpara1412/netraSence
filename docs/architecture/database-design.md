# Database Design

## Current database model

The backend is configured to use SQLite by default (`sqlite:///./retinasight_dev.db`) and supports PostgreSQL by setting `DATABASE_URL` for shared deployments. This settings pattern is helpful because it avoids accidental fallback behavior while still supporting a local development workflow.

## Data concerns

The application stores the clinical workflow data needed for a screening prototype:

- user accounts and roles
- clinician/admin authentication metadata
- patient records
- screening sessions
- review and override decisions
- generated reports
- uploaded or processed image assets

## Architectural intent

The design keeps data separation explicit rather than mixing model artifact storage directly into user tables. This is the appropriate approach for a medical screening workflow because image files and screening metadata are distinct concerns that should be managed through consistent service boundaries.

## Guardrails already present

- `ALLOW_SQLITE_FALLBACK` is disabled by default.
- Deployment configuration prevents unsafe production defaults.
- Storage directories are created programmatically at startup.
- The application avoids exposing patient or model internals to the browser.
- SQLite connections enable foreign-key enforcement so database-level `ON DELETE` behavior matches the declared schema.
- PostgreSQL URLs use the installed `psycopg2` driver explicitly, including legacy `postgres://` URLs.

## Recommended next phase

The next production-grade step is to add scoped authorization and stronger audit tables: who created or reviewed a record, when a doctor override happened, and which image artifacts were associated with the decision.
