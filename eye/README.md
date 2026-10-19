# RetinaSight AI

RetinaSight AI is a React/Vite screening prototype with a FastAPI backend. The
current UI includes explicitly labelled demo cases; real uploaded images are
sent to the backend and are never replaced with demo predictions when the
backend is unavailable.

This software is a research prototype, not a validated medical device.
Clinicians must not use its output as an autonomous diagnosis.

## Local development

Real-image upload, analysis, and review routes require a signed-in
administrator, clinician, or developer account. The frontend now offers
sign-in and attaches the bearer token to backend requests. Use only synthetic
data on a loopback development environment: database records are not scoped
between organizations, and stored images are not yet privately served.
Production mode remains deliberately disabled. See
[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for setup and limitations.

Install frontend dependencies from `eye/`:

```powershell
npm install
npm run dev
```

The local development default is a persistent SQLite database at
`eye/backend/retinasight_dev.db`, so no database server installation is needed.
PostgreSQL is supported for shared deployments through `DATABASE_URL` and is
configured in the Compose workflow. Apply migrations and create the first
administrator before starting the service:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python scripts\create_admin.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The Vite frontend uses `http://localhost:8000` by default. Override it with
`VITE_API_URL` when needed.

Sign in through the **Sign in** button using the administrator created above.
The password is entered without echo and only its hash is stored in the
database. Public registration, if called directly, creates PATIENT accounts,
which cannot use clinician screening routes.

## Train the supplied IDRiD classifier

The provided grading labels contain 413 training and 103 official testing
images. From `eye/backend/`, train using the repository's supplied data:

```powershell
python -m app.ml.classification.trainer
```

The trainer writes the model checkpoint under `backend/ml/weights/` and a
machine-readable evaluation report beside it. Training requires the Python
dependencies and may download ImageNet initialization weights if they are not
cached. Exact duplicate-content conflicts and train/test duplicates are
excluded and documented in the checkpoint metadata. Until a trained checkpoint
is installed, the backend refuses to generate a DR prediction. Outputs remain
research-only and uncalibrated even after a training run.

See [backend/README.md](./backend/README.md) for dataset handling, metrics,
testing, and limitations. Root audit and evaluation documents are in
[../docs/](../docs/). Full-stack setup notes are in
[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).
