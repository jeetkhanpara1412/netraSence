# NetraSense Diabetic Retinopathy Screening Prototype

This repository contains a React/Vite frontend and a FastAPI/PyTorch backend
prototype for diabetic-retinopathy research and screening workflow development.
It is not a validated medical device. There is no trained model checkpoint in
the repository and no clinical validation. Real-image workflow endpoints
require clinician/admin sign-in, but records are not scoped between
organizations and stored images are not privately served. Do not use it with
identifiable patient data or for clinical decisions.

The supplied project presentations include proposed targets and capabilities
that have not been demonstrated by this software. The original project brief,
proposal notes, and presentation decks are grouped under [docs/project/](./docs/project/)
and [docs/presentations/](./docs/presentations/). See
[docs/PROJECT_AUDIT.md](./docs/PROJECT_AUDIT.md) and
[docs/MODEL_EVALUATION.md](./docs/MODEL_EVALUATION.md).

## Workspace layout

```text
.
├── docs/                    # Project docs, architecture notes, and audits
│   ├── architecture/       # system and component architecture references
│   ├── api/                # authentication and endpoint documentation
│   ├── deployment/        # local and production deployment guides
│   ├── presentations/     # Project slide decks
│   └── project/            # Challenge brief and proposal notes
├── eye/                     # React/Vite frontend and FastAPI backend
│   ├── backend/
│   └── src/
└── SIHDatasets/             # Supplied, real IDRiD and retinal-vessel images
```

## Architecture and refactoring documentation

The repository already contains the core application structure for a modular,
feature-oriented screening system. The current architecture documentation is
stored in [docs/architecture/](./docs/architecture/) and covers the frontend,
backend, data model, ML pipeline, and security posture. The implementation is
not a greenfield rewrite; it is a prototype that is being documented and
hardened around the actual code that exists today.

The classifier reads IDRiD images directly from
`SIHDatasets/idrid/images/`; the dataset is not copied into the application.
See [docs/README.md](./docs/README.md) for the documentation index.

## Reproducible dataset check

Python and Pillow are required. From the repository root:

```powershell
python eye\backend\scripts\validate_datasets.py
```

The command writes `docs/DATASET_VALIDATION.json` and exits non-zero if a
required check fails. Dataset files are deliberately not ignored by Git; review
each source license and hosting policy before publishing them in a public
repository.

## Application development

See [eye/README.md](./eye/README.md) for local development and
[eye/SETUP_INSTRUCTIONS.md](./eye/SETUP_INSTRUCTIONS.md) for environment
configuration, migrations, and local-only Compose setup.

Production deployment is intentionally disabled until authentication and
authorization protect the patient, screening, review, report, and image-storage
endpoints. Probability calibration and independent clinical validation are
also absent.
