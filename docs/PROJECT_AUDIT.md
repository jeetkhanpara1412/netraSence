# NetraSense Project Audit

## Executive status

**Research/demo prototype only — not ready for public, clinical, or identifiable
patient-data deployment.** The software in `eye/` is a React/Vite frontend and a
FastAPI/PyTorch backend. It is not a MATLAB/Simulink application. The repository
does not contain trained weights, verified model metrics, clinical validation,
or tenant-scoped patient/image access.

Update (2026-10-19): a clinician sign-in UI now attaches bearer tokens to
real-image workflow requests. Local SQLite is the no-install default;
PostgreSQL remains supported. These changes do not make the application
production-safe; see [FINAL_AUDIT_REPORT.md](./FINAL_AUDIT_REPORT.md).

This audit was performed against the files in the provided workspace. The
workspace root is not a Git repository, so repository history, staged changes,
remotes, and commit contents could not be reviewed. Project proposal documents
and slide decks are organized under `docs/project/` and `docs/presentations/`.
No commit, push, or deployment was made.

## Findings and work completed

| Severity | Finding | Status |
|---|---|---|
| Critical | Tenant-scoped patient/screening/review/report authorization and private image delivery are missing. | **Open blocker.** Workflow routes require bearer authentication, but records are not scoped by organization/owner and `/storage` remains public. Production mode refuses to start. |
| Critical | No trained model checkpoint is supplied. Training and inference results are therefore unavailable. | **Open blocker.** The backend refuses prediction without a valid checkpoint. |
| High | Previous configuration included a fixed secret, wildcard CORS, SQLite fallback, default database/user credentials, and synthetic identity/patient seed records. | Fixed defaults and static seed records removed; CORS uses explicit origins; non-development settings require a strong secret and disable SQLite fallback. |
| High | A trained model could report softmax scores as confident/calibrated and supply fixed referral timing/advice despite no calibration or clinical evaluation. | Removed arbitrary temperature scaling, confidence-based certainty tiers, and unsupported model-generated referral timelines. Results are explicitly uncalibrated and require clinician review. |
| High | Vite embeds `VITE_API_URL` at build time, while Compose previously supplied it only at runtime. | Compose now supplies a frontend build argument. |
| High | Application startup attempted `create_all`, logged and suppressed schema errors, which could hide a broken database or migration state. | Startup no longer mutates the schema or suppresses errors. Compose runs Alembic migrations before starting the API. |
| Medium | Patient external IDs were derived from Python's randomized name hash. API pagination was unbounded. Grad-CAM could default to grade 2 without a prediction. | IDs are random UUID-based values; list bounds and target-grade validation are enforced; explanations require an existing prediction. |
| Medium | Training/validation split used image IDs and could put byte-identical samples in separate partitions; some identical images have conflicting labels, and an exact image occurs across the supplied train/test folders. | Training now groups by exact SHA-256, excludes contradictory duplicate-content training groups and training copies overlapping the official test set, and records these exclusions in model metadata. |
| Medium | Missing patient age was stored as `0`, and application defaults/documentation implied a specific camera/operator. | Age is nullable with an Alembic migration; camera/operator defaults and API examples no longer imply real identities or equipment. |
| Medium | Dataset README described paths that do not exist in this workspace. | Replaced with actual `SIHDatasets/` paths and noted that retinal-vessel redistribution terms were not found in the supplied tree. |

## Security and deployment boundary

The API has bearer login and role checks for workflow routes, but CORS is not
an authorization control, record ownership/organization scoping is absent,
and the `/storage` mount is public. Do not expose the API or use real patient
identifiers/images. `ENVIRONMENT=production` remains rejected until access
controls are implemented and tested.

Compose now requires credentials in `eye/.env`, excludes local environment
files from Git, restricts default host bindings to `127.0.0.1`, and configures
Vite's API URL during the image build. These are development safeguards, not a
production deployment design. No Docker build or live deployment was tested.

## Application and project-claim gaps

- There is no checked-in trained model, independent evaluation, probability
  calibration, external-site evaluation, or clinical validation.
- The IDRiD official test partition has only 103 labelled images, including
  five grade-1 cases. The training labels have 20 grade-1 cases. These sample
  sizes do not support broad clinical performance claims.
- No evidence in the implementation establishes presentation targets such as
  sensitivity above 90%, specificity above 85%, calibrated uncertainty,
  validated lesion evidence, or validated multiple-dataset performance.
  Treat these as proposed targets, not achieved outcomes.
- Lesion segmentation data and retinal-vessel data are present, but the
  classification trainer does not train or evaluate lesion segmentation,
  vessel segmentation, or cross-dataset generalization.
- The generated prediction is research-only and cannot rule disease in/out or
  determine/defer care.
- No deployment, regulatory, privacy-impact, threat-model, or clinical safety
  review has been completed.

## Verification state

The reproducible dataset validator passed; detailed results are in
[DATASET_VALIDATION.md](./DATASET_VALIDATION.md) and
[DATASET_VALIDATION.json](./DATASET_VALIDATION.json). The final frontend
production build and TypeScript check passed. Python AST parsing passed for all
41 backend Python files. The isolated synthetic duplicate-split test passed,
and the same helper was exercised against the supplied IDRiD labels. Backend
pytest is blocked because `pydantic_settings` is not installed in this
environment; PyTorch/torchvision are also absent, preventing training and
inference validation. Docker is unavailable, so container build and runtime
migration tests were not run.

## Required before any shared/clinical deployment

1. Implement tested authentication, role-based authorization, and ownership/
   facility scoping for every patient, screening, image, review, and report
   route; remove public static access to protected images.
2. Complete privacy, retention, encryption, audit, backup, secrets-management,
   threat-model, and deployment reviews for the target jurisdiction/site.
3. Train only with a documented, reproducible pipeline; preserve a locked
   evaluation set; publish per-class confidence intervals and calibration
   results; obtain external and prospective clinical validation.
4. Validate every clinical threshold, recommendation, workflow, and user-facing
   claim with qualified clinical and regulatory reviewers.
5. Run the full backend test suite, frontend build/lint, migrations, container
   build, and deployment smoke tests in the target environment.
