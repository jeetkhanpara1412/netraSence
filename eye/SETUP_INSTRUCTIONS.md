# Local Setup and Deployment Boundary

The application is a research/demo prototype, not a clinical system. Real
patient, screening, report, and review API routes require a signed-in account
with an allowed role. Records are not yet scoped between organizations and
stored images remain publicly served. Do not use identifiable patient data or
expose it on a shared/public network. Production mode remains rejected until
all access controls are implemented and tested.

## Prerequisites

- Node.js 20 or later and npm
- Python 3.11 (backend Docker image) or a compatible local Python
- The declared backend and frontend dependencies
- PostgreSQL 16 and Docker Compose v2 only for the optional Compose workflow

The local Python workflow uses a persistent SQLite database and requires no
database server installation. PostgreSQL remains the recommended choice for a
shared deployment; configure it with `DATABASE_URL` and keep SQLite fallback
disabled so a connection failure cannot silently switch databases.

## Local Compose workflow

Compose files are in this `eye/` directory. Configure credentials first:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace `POSTGRES_PASSWORD` and `SECRET_KEY` with unique
random values. Use alphanumeric characters for the PostgreSQL password because
it is embedded in `DATABASE_URL`. Never commit the populated `.env`. The
example file is intentionally not a usable credential.

From `eye/`:

```powershell
docker compose up --build -d
docker compose ps
docker compose logs -f backend
```

The frontend and backend are bound to `127.0.0.1` by default. `VITE_API_URL` is
passed as a frontend build argument because Vite embeds it into the static
assets; changing it requires rebuilding the frontend image. `CORS_ORIGINS`
must list the exact browser origins, comma-separated. Do not use `*`.

Compose applies Alembic migrations before starting the backend. No trained
checkpoint is included; image analysis consequently returns model-unavailable
until a compatible checkpoint is trained and installed. PostgreSQL is internal
to the Compose network; the Compose file does not publish its port.

## Local backend and frontend development

1. From `eye/backend/`, create and activate a Python virtual environment and
   install the backend dependencies if they are not already installed:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. The default local database is `sqlite:///./retinasight_dev.db`. Optionally
   copy `backend/.env.example` to `backend/.env`; `.env` is ignored by Git.
   PostgreSQL can be selected by setting `DATABASE_URL` to its SQLAlchemy
   connection URL. Do not set `ENVIRONMENT=production`; tenant and image
   authorization are not complete.
3. Run migrations and create the first administrator from `eye/backend/`:

   ```powershell
   alembic upgrade head
   python scripts\create_admin.py
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

   The command prompts for email, name, and a new password (12-72 UTF-8
   bytes); input is hidden and only a bcrypt hash is stored. If that email
   already belongs to a user, the command promotes that account and resets its
   password. It refuses to run once an administrator exists.

4. In another terminal, from `eye/`, run (if dependencies are already
   installed, no installation command is needed):

   ```powershell
   $env:VITE_API_URL = "http://localhost:8000"
   npm run dev
   ```

The app does not seed sample patient identities or default passwords. Public
self-registration creates only a `PATIENT` account; requested privileged
roles are rejected. The local administrator bootstrap is an explicit
interactive command. Demo UI records are illustrative and must remain clearly
labelled as demo data. Reviewer-name fields are not authenticated identities
and do not constitute a digital signature.

## Training and dataset checks

The dataset layout and licensing notes are in `../SIHDatasets/README.md`.
Run `python scripts\validate_datasets.py` from `eye/backend/` or use the
repository-root command in the root README. Training requires PyTorch,
torchvision, scikit-learn, OpenCV, Pillow, the labelled IDRiD dataset, and
potentially a download of ImageNet initialization weights:

```powershell
python -m app.ml.classification.trainer --seed 42
```

The trainer emits a checkpoint and a machine-readable evaluation report.
Check the report and [../docs/MODEL_EVALUATION.md](../docs/MODEL_EVALUATION.md)
before quoting metrics. Do not use uncalibrated softmax outputs as calibrated
confidence or a clinical decision.

## Tests and build

From `eye/`:

```powershell
npm run build
npm run lint
```

From `eye/backend/`, with backend dependencies installed:

```powershell
pytest tests/ -v
```

The backend test suite imports application settings, database, and ML modules;
install the declared backend requirements before running it. Dataset validation
uses Pillow and the Python standard library; it does not require PyTorch.

## No production deployment procedure

This project is not safe to deploy for clinical or patient-data use. At a
minimum, implement and test authentication, role/facility-scoped authorization,
protected image delivery, privacy/retention controls, audit logging, secret
management, and target-environment security review. Also complete independent
model calibration and external/clinical validation. A CORS allowlist and
loopback-only Compose port bindings are not substitutes for access control.
