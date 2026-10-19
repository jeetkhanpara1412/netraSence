# Local Development Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- access to the `SIHDatasets/` folder for local validation and model training

## Frontend

From the repository root:

```powershell
cd eye
npm install
npm run dev
```

The application runs with Vite on the configured local port and calls the backend over the configured API URL.

## Backend

From `eye/backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

This uses the local SQLite database and storage folder by default. For a production-grade deployment, the project must be configured with secure secrets and a trusted database environment instead of the local development defaults.

## Data validation

```powershell
python eye\backend\scripts\validate_datasets.py
```

The script writes dataset validation output and should be used before model training or evaluation scripts are run.
