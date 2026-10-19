# NetraSense Final Project Audit

**Audit date:** 2026-10-19  
**Overall disposition:** **FAIL — not ready for public, production, or clinical use.**  
This repository is a research/demo prototype, not a validated medical device.
No push, commit, deployment, dataset deletion, or model training was performed.

## Status legend

- **PASS** — verified by an executed check.
- **FAIL** — a check failed or a verified unsafe condition exists.
- **BLOCKED** — a required dependency, service, or environment was unavailable.
- **NOT TESTED** — no verification was performed.

## 1. Repository and file-structure status

| Status | Check | Result |
|---|---|---|
| PASS | Workspace layout and source entry points | Root contains `docs/`, `eye/` (Vite frontend and FastAPI backend), and `SIHDatasets/`. Frontend production build, Python tests, and syntax parsing exercised source files. |
| PASS | Backend syntax | Python AST parsing succeeded for all 50 backend Python source files, excluding the virtual environment and generated caches. |
| BLOCKED | Git status, staged/unstaged changes, remotes, and clean-checkout test | The workspace root is **not a Git repository** (`git rev-parse --show-toplevel` failed). There is no Git metadata to inspect changes, tracked content, commit history, or remotes, and no way to verify a clean checkout. |
| PASS | Ignore rules and environment templates | Root and nested `.gitignore` rules exclude populated `.env` files, local databases, virtual environments, build output, local storage, and model weights; `SIHDatasets/` is deliberately not ignored. The three `.env.example` files inspected contain no populated password/secret/token/API-key values. |
| PASS | Oversized files | A recursive check outside dependency, cache, and build directories found no files larger than 100 MiB. |
| NOT TESTED | Secret/credential and sensitive-data absence | A credential-pattern scan did not identify a confirmed credential. Because the workspace is not a Git checkout, committed history and staging could not be scanned. Binary presentation/document contents and the contents of the local storage images were not inspected for personal or restricted information. |
| PASS | Local database contents | The two local SQLite files examined contained no application tables or patient rows. This does not establish that other uninspected binary files are free of sensitive content. |
| PASS | Required model asset inventory | No trained `.pth`/`.pt` checkpoint exists under `eye/backend/ml/weights/`; only a helper source file is present. The backend correctly treats a missing checkpoint as unavailable rather than making a prediction. |
| PASS | Dataset/asset inventory | The supplied data tree contains 1,070 files. The dataset validator decoded and checked image/mask structure, labels, landmarks, duplicates, and license-file presence without errors. |

Setup instructions are present in [README.md](../README.md),
[eye/README.md](../eye/README.md), and
[eye/SETUP_INSTRUCTIONS.md](../eye/SETUP_INSTRUCTIONS.md). A setup from a
clean checkout was **not tested** because there is no Git repository. An
undeclared `email-validator` dependency and an incompatible bcrypt upper
version were found during test setup and added/pinned in the backend
requirements.

## 2. Security findings

### Critical

| Status | Finding |
|---|---|
| PASS (no confirmed critical issue found in the executed checks) | No confirmed critical-severity vulnerability was established during this audit. This is not a claim that the system is secure. |

### High

| Status | Finding |
|---|---|
| FAIL — remediated in workspace | Public registration previously accepted a caller-selected privileged role and issued a token. Registration now accepts only `PATIENT`; the automated test verifies an `ADMIN` registration is rejected and the resulting patient role cannot list patients. There is still no documented secure privileged-account provisioning workflow. |
| FAIL — open | Screening and patient queries are not scoped to an organization, facility, or record owner. The data model has no tenant ownership boundary, and clinician/admin routes can list or retrieve records across the whole database. A valid clinician credential could therefore access another organization's records in a shared deployment. No cross-organization test was possible because no organization model/test fixture exists. |
| FAIL — open | Uploaded/generated image storage is mounted as unauthenticated static content at `/storage`. A URL or storage path disclosed by an authenticated workflow can be fetched without authorization; there is no per-user or per-organization image access check. |

### Medium

| Status | Finding |
|---|---|
| FAIL — open | Login and registration routes are excluded from the application rate limiter. Failed logins trigger an account lock after a configurable number of attempts, which does not prevent distributed password guessing and can be abused to lock a victim's account. |
| FAIL — open | Logout only returns a message; access tokens are stateless, have no revocation list, and remain usable until expiry (configured default: 24 hours). Password changes also do not invalidate already-issued tokens. |
| FAIL — open | Password-reset functionality is not implemented. The configured reset-TTL setting is not an implemented reset flow. |
| FAIL — open | API-key creation stores a hash and supports expiration/revocation metadata, but the declared scopes are not enforced and no route uses the API-key authentication dependency. There is no usable external API-key integration contract. |
| FAIL — open | Account registration issues a bearer token even though the account is marked `email_verified=false`; verification is not implemented. |

### Low

| Status | Finding |
|---|---|
| FAIL — open | The unauthenticated health endpoint discloses limited service/version, database engine type, model architecture, and model readiness details. No patient record is returned by this endpoint. |
| FAIL — open | The API's frame policy is `frame-ancestors 'none'`/`X-Frame-Options: DENY`; iframe embedding is intentionally unavailable. No `postMessage` integration is implemented. |

### Security controls and verification

| Status | Control/result |
|---|---|
| PASS | Passwords use Passlib bcrypt hashing. Login rejects a wrong password; the registration/login test exercises successful login. |
| PASS | Bearer JWTs carry an expiry and are decoded with expiry validation. Token expiration/revocation was not tested end-to-end. |
| PASS | Patient-list routes reject missing authentication and reject a self-registered `PATIENT` token. |
| PASS | CORS configuration rejects wildcard origins and uses an explicit origin list. Security-header middleware sets content-type, referrer, permissions, and frame policies. These controls do not provide authorization. |
| NOT TESTED | CSRF cookie protections are not applicable to the observed bearer-header flow; no cookie session is implemented. No browser-origin/CORS preflight or response-header integration test was run. |
| NOT TESTED | Admin, clinician, and developer access matrices were not exhaustively exercised; no secure privileged test accounts or tenant fixtures exist. |
| BLOCKED | Python dependency advisory scan: `pip-audit` could not resolve `pypi.org` in this environment; a verified Python advisory result is unavailable. npm audit is reported under deployment/dependencies below. |

## 3. Authentication, authorization, API, and embedding tests

| Status | Test/result |
|---|---|
| PASS | Existing backend auth tests: user registration, successful login, bad-password rejection, missing-auth rejection. Extended test verifies that registering as `ADMIN` receives HTTP 422 and PATIENT cannot access the patient list. |
| PASS | API workflow tests now use an authenticated synthetic clinician for image upload, analysis, review, and report retrieval. |
| NOT TESTED | Logout revocation, token expiration at runtime, password-change token invalidation, reset, account verification, and the full role matrix. |
| NOT TESTED | Cross-organization/cross-facility access; these authorization boundaries are not represented in the current data model. |
| FAIL | Public API-key integration, scope enforcement, quota behavior, key-authenticated API calls, and external website integration are not implemented end-to-end. Key metadata endpoints alone do not establish an external API. |
| PASS | FastAPI's generated OpenAPI/docs surface is part of the app; backend tests import the API. No standalone, versioned external API contract or endpoint-by-endpoint consumer compatibility test exists. |
| FAIL | Iframe embedding is blocked by frame policies; there is no `postMessage` origin validation or embed-specific token flow. |
| NOT TESTED | Upload size/type/content adversarial cases and public unauthenticated image retrieval were not replayed over a running public deployment. |

## 4. Dataset integrity and AI/ML

| Status | Test/result |
|---|---|
| PASS | Executed `python eye\backend\scripts\validate_datasets.py`; result: `passed`, no errors. The supplied IDRiD grading/landmark/segmentation material and retinal-vessel image/mask assets remain in place. |
| PASS | IDRiD license text files are present. Dataset documentation says the retinal-vessel source license was not found; verify redistribution rights before publishing those files. |
| PASS | Dataset documentation records the IDRiD labelled counts: 413 training and 103 official testing records. The validator checked image decoding, dimensions, labels, annotation coverage, duplicates, and mask structure. |
| PASS | Model-readiness tests confirm missing/untrained checkpoints are rejected and prediction does not fall back to random weights. |
| BLOCKED | Real inference on a supplied fundus image: no trained model checkpoint is available. No prediction, metric, confidence calibration, or clinical-performance claim can be made. |
| BLOCKED | Grad-CAM with the actual trained model and segmentation inference: no compatible checkpoint/segmentation model is supplied. The retinal-vessel and lesion annotations are not evidence that corresponding trained segmentation models exist. |
| NOT TESTED | Evaluation metrics, model calibration, external-site generalization, and clinical validation. Training was not run; the user explicitly prohibited unnecessary expensive retraining. |
| PASS | Model code documents five ICDR classes and produces explicit model-unavailable errors when weights are absent. Its probability/confidence outputs are not calibrated or clinically validated. |

The dataset validator wrote/updated
[DATASET_VALIDATION.json](./DATASET_VALIDATION.json); its detailed scope is
described in [DATASET_VALIDATION.md](./DATASET_VALIDATION.md). Model claims
and evaluation limitations are described in
[MODEL_EVALUATION.md](./MODEL_EVALUATION.md).

## 5. Frontend, backend, and database

| Status | Test/result |
|---|---|
| PASS | Frontend production build: `npm run build`. |
| PASS | Frontend type check: `npm run lint` (`tsc --noEmit`). |
| PASS | Frontend runtime probe: Vite served the home route at `http://127.0.0.1:3000/` with HTTP 200. Existing two-page UI source was not redesigned or modified. |
| PASS | Backend suite after remediation: `13 passed` using the repository's in-memory SQLite test setup. |
| PASS | Clean SQLite migration exercise: `alembic upgrade head`, followed by `alembic check`; all migrations applied and no schema drift was detected. |
| FAIL — remediated in workspace | Migration graph had two heads (`002_nullable_patient_age` and `002_security_auth_and_api_keys`); the age migration used a SQLite-incompatible direct `ALTER COLUMN`; and model indexes/nullability were missing from migrations. Added a merge migration, batch alter, and schema migration; the clean SQLite upgrade/check now passes. |
| PASS | Synthetic upload/analyze/review/report workflow executes with auth. In this environment the model is unavailable, so the workflow verifies explicit unavailability rather than real inference. |
| BLOCKED | PostgreSQL connectivity/startup: no configured local `.env`/database service was available. The migration check was run on isolated SQLite, not PostgreSQL. |
| PASS | Backend imports exercised by pytest after adding `email-validator`; bcrypt was constrained to a Passlib-compatible `<5` release. |

## 6. Deployment readiness

| Status | Check/result |
|---|---|
| FAIL | Production mode is intentionally rejected by backend settings until route access controls are implemented. The system must not be treated as production-ready. |
| BLOCKED | Docker/Compose configuration validation and container builds: Docker CLI is unavailable. |
| NOT TESTED | Live public frontend/backend health, HTTPS termination, trusted proxy handling, production CORS, backups/restoration, log retention/monitoring, and persistent production storage. No public deployment URL or environment credentials were present. |
| PASS | Compose configuration declares PostgreSQL data volume and backend storage/model-weight mounts. Services bind host ports to loopback by default, which is a local-development precaution, not a production access-control boundary. |
| PASS | Compose requires non-empty database password and secret values; templates contain blank placeholders. Frontend API URL is a build-time Vite argument. |
| FAIL | Default Compose frontend API URL is `http://localhost:8000`; it is suitable only when the browser runs on the same host as the loopback-bound backend. A remote/external deployment needs an explicitly configured reachable HTTPS API URL and matching CORS origins. |
| FAIL | Public static image mount and missing organization/record ownership checks make any shared deployment unsafe, irrespective of network binding or TLS. |
| PASS | `npm audit --json` completed using the lockfile: 310 resolved dependencies, zero reported vulnerabilities. |
| BLOCKED | Python dependency CVE audit: registry DNS/network access failed. No clean Python advisory result is claimed. |

## 7. GitHub readiness

| Status | Result |
|---|---|
| BLOCKED | GitHub readiness cannot be established: there is no `.git` directory, so staged/unstaged state, tracked/untracked files, commit history, and remotes are unavailable. |
| NOT TESTED | No push, remote-history rewrite, or deployment was attempted. |
| PASS | No non-dependency file larger than 100 MiB was found. Model-weight patterns and local databases/storage are ignored; dataset content is intentionally not ignored. |
| BLOCKED | Whether data/assets are committed or within GitHub hosting limits cannot be determined without Git metadata. Dataset/image hosting rights and the retinal-vessel license must be reviewed before publication. |

## 8. Files modified during remediation

- `eye/backend/app/schemas/auth.py` and `eye/backend/app/api/endpoints/auth.py` — restrict public registration to PATIENT and hard-code that role. (Applied during the audit; verifies remediation of the high-severity role-escalation finding.)
- `eye/backend/tests/test_auth_security.py` — tests privileged-role rejection and patient-role access denial.
- `eye/backend/tests/test_api_workflow.py` — uses a synthetic authenticated clinician for protected workflow routes.
- `eye/SETUP_INSTRUCTIONS.md` — explains the self-registration role limit and missing privileged-account provisioning.
- `eye/backend/requirements.txt` — declare `email-validator`; constrain bcrypt to `<5` for Passlib compatibility.
- `eye/backend/app/db/models.py` — align nullable/default model columns with schema intent.
- `eye/backend/alembic/versions/002_nullable_patient_age.py` — use batch alteration for SQLite compatibility.
- `eye/backend/alembic/versions/003_merge_auth_and_patient_age.py` — merge the two existing migration heads.
- `eye/backend/alembic/versions/004_add_model_indexes.py` — add indexes present in SQLAlchemy metadata but absent from migrations.
- `eye/.tsupgrader/runtime-validation/eval-plan.json` — records frontend build/type-check, backend test, and home HTTP-probe validation.
- `eye/.tsupgrader/runtime-validation/standalone-result.json` — generated validation execution record.
- `docs/DATASET_VALIDATION.json` — generated/updated by the executed dataset-integrity validator.
- `docs/FINAL_AUDIT_REPORT.md` — this report.

No UI redesign, original dataset deletion, model-weight substitution, Git
operation, push, or deployment was performed.

## 9. Unresolved issues and exact causes

1. **Tenant/record authorization (FAIL):** patient/screening records have no
   organization/facility ownership boundary, and clinician routes query across
   all records. Add tenant ownership to the schema and enforce it in every
   query, image URL, review, and report route before shared use.
2. **Private image delivery (FAIL):** `app.main` mounts the storage directory
   with public `StaticFiles`. Replace with authenticated, ownership-checked
   image delivery or short-lived signed URLs.
3. **Session invalidation and reset (FAIL):** logout has no revocation state;
   password reset and email verification are absent. Existing JWTs last up to
   the configured expiry.
4. **Public API-key contract (FAIL):** key scopes are stored but unused, and
   API-key authentication is not wired to public endpoints. No external
   website/iframe integration should be advertised as available.
5. **Throttling (FAIL):** authentication routes bypass the generic rate limiter;
   the present limiter is in-process and not suitable for multi-worker
   production throttling.
6. **Model evidence (BLOCKED):** no trained checkpoint or segmentation model
   is supplied. Actual inference, Grad-CAM, metrics, and clinical validation
   remain unavailable.
7. **Production infrastructure (BLOCKED):** Docker, PostgreSQL, production
   HTTPS/proxy, deployment URL, secrets, monitoring, backup, and recovery
   environment were unavailable or not configured.
8. **Python dependency advisories (BLOCKED):** the package advisory scanner
   could not reach its online source due to DNS/network failure.
9. **Git/clean checkout (BLOCKED):** no repository metadata exists in the
   workspace, preventing status/history/remote and clean-checkout verification.
10. **Dataset redistribution (NOT TESTED):** IDRiD license notices are present;
    the supplied retinal-vessel tree has no license text, so redistribution
    terms remain unverified.

## 10. Prioritized remaining actions

1. **P0 — Do not deploy or use with identifiable patient data.** Keep
   production mode disabled until tenant-aware authorization and private image
   delivery have been independently reviewed and tested.
2. **P0 — Implement and test tenant scoping** for patient, screening, review,
   report, and every image/evidence endpoint; add cross-tenant negative tests.
3. **P0 — Remove public static image access** and test anonymous, cross-user,
   and cross-tenant image retrieval denial.
4. **P1 — Complete authentication lifecycle:** secure privileged-account
   provisioning, email verification, password reset, login throttling, and
   revocable sessions/token rotation.
5. **P1 — Either implement a documented external API** with enforced key
   scopes, quotas, expiration, revocation, and tenant checks, or disable/remove
   the incomplete API-key feature. Keep embedding disabled until origin-bound
   credentials and safe `postMessage` checks exist.
6. **P1 — Run Python dependency advisory scanning** in an environment with
   registry/advisory access; review and remediate any findings.
7. **P1 — Supply an approved trained artifact and evaluation evidence** before
   attempting inference claims; independently review split provenance,
   calibration, subgroup/external performance, Grad-CAM, and clinical
   validation. Do not interpret training-set or software-test success as
   clinical validation.
8. **P1 — Validate deployment infrastructure** in its target environment:
   Docker image builds, PostgreSQL migrations, HTTPS/proxy/CORS, persistent
   storage, secrets management, health checks, centralized logs, backups, and
   recovery drills.
9. **P2 — Restore Git metadata/use a clean clone** and repeat status, secret,
   data/license, large-file, and documented setup checks before GitHub
   publication.
10. **P2 — Resolve and document retinal-vessel asset licensing** before
    redistributing the dataset.
