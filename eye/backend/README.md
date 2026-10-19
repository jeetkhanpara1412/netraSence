# RetinaSight AI backend

FastAPI backend for the RetinaSight screening prototype. This project is not a
validated medical device and must not be used as an autonomous diagnostic
system.

## Model availability

The backend loads only the trained checkpoint configured by `MODEL_PATH`
(default: `backend/ml/weights/efficientnet_b0_dr.pth`). It does not treat an
ImageNet backbone or an untrained classification head as a DR model. If the
checkpoint is absent or invalid, `/api/health` reports a degraded model state
and a gradable screening's `/analyze` endpoint returns HTTP 503.

## Supplied datasets

The repository-level `SIHDatasets/idrid` folder contains the labelled IDRiD
disease-grading split:

| Split | Labelled images | Grade 0 | Grade 1 | Grade 2 | Grade 3 | Grade 4 |
|---|---:|---:|---:|---:|---:|---:|
| Training | 413 | 134 | 20 | 136 | 74 | 49 |
| Official testing | 103 | 34 | 5 | 32 | 19 | 13 |

The grading pipeline uses only rows in the corresponding grading CSVs and
validates that every labelled image exists. Other files in the image folders
without grading rows are not assigned invented labels and are excluded from
classification. The separate retinal-vessel dataset is not a source of DR
grades and is not used by this classifier.

## Train and evaluate

From `eye/backend` with the dependencies installed:

```powershell
python -m app.ml.classification.trainer
```

By default the trainer finds the supplied IDRiD dataset relative to the source
tree, makes a reproducible stratified validation split from the training
labels, selects the checkpoint using validation QWK (weighted F1 fallback),
and evaluates the official test split once after selection. It writes:

- `ml/weights/efficientnet_b0_dr.pth`
- `ml/weights/efficientnet_b0_dr.evaluation.json`

The JSON report includes dataset counts, a majority-class validation baseline,
per-class and aggregate metrics, confusion matrices, the selected epoch,
runtime, and configuration. No tuned-vs-baseline claim is made unless an
experiment is run and its measured results are recorded.

Useful options include `--epochs`, `--batch_size`, `--lr`, `--seed`,
`--validation_fraction`, `--num_workers`, and `--no_pretrained`. ImageNet
initialization may download the torchvision weights on the first training run.
Do not point the official test labels at training or validation data.

## Run API and tests

For local development, the backend uses persistent SQLite at
`retinasight_dev.db` by default and does not require a separately installed
database server. PostgreSQL is supported by setting `DATABASE_URL`; Compose
uses PostgreSQL with a persistent Docker volume. Do not enable SQLite fallback
for a configured PostgreSQL deployment, as database connection failures must
remain visible.

After migrations, create a local administrator interactively:

```powershell
python scripts\create_admin.py
```

The command prompts for a new password without echoing it and stores only its
hash. If the email already belongs to a user, it promotes that account and
resets its password; it refuses to run once an administrator exists. Sign in
through the frontend; real-image API requests include the resulting bearer
token.

```powershell
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
python -m pytest tests -q
```

The backend exposes `/api/health`, `/api/screenings/upload`, and screening
analysis/review/report routes. Lesion segmentation, anatomical structure
assessment, and Grad-CAM/lesion spatial validation are not implemented as
trained/validated models; their responses are marked unavailable or not
assessed rather than reporting fabricated findings.
