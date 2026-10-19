# Model Evaluation Status

## Current result: not evaluated

There is no trained classifier checkpoint in this repository, so there are no
valid inference results, accuracy/sensitivity/specificity estimates,
confidence intervals, calibration results, Grad-CAM validation results, or
clinical performance results to report. No values are invented here. The
backend must return an unavailable response until a compatible trained
checkpoint and metadata are present.

The supplied IDRiD labels contain 413 training and 103 official-test records.
Their grade distributions are:

| Grade | Training | Official test |
|---:|---:|---:|
| 0 | 134 | 34 |
| 1 | 20 | 5 |
| 2 | 136 | 32 |
| 3 | 74 | 19 |
| 4 | 49 | 13 |

In particular, five grade-1 test examples cannot support precise class-wise
clinical performance conclusions.

## Training controls

The trainer uses deterministic seeds and records its configuration,
validation metrics, a validation majority-class baseline, official-test
metrics, and dataset split sizes in the checkpoint sidecar. The validation
partition is grouped by exact image SHA-256 to prevent byte-identical files
crossing train/validation boundaries. Contradictory exact-duplicate groups are
excluded rather than assigned conflicting training labels. Training images
identical to official-test images are excluded from training. The official
test partition is not used for checkpoint selection.

For the supplied files with seed 42 and the default 20% validation fraction,
the split helper was independently exercised: 326 training and 82 validation
records remain after excluding two contradictory training duplicate groups
(four records) and the training record duplicated in the official test folder.
The official test remains 103 records. These are split counts, not performance
metrics.

These controls improve reproducibility and reduce known leakage; they do not
guarantee the absence of all leakage or establish generalization. A run must be
executed and its generated report independently reviewed before quoting any
metric.

The previous fixed temperature-scaling parameter was removed because it was
not fitted on a calibration set. Softmax outputs and normalized entropy are
therefore uncalibrated/descriptive only. The backend labels the uncertainty
accordingly and does not generate grade-specific referral timelines or care
recommendations. Every output requires qualified review and must not be used
alone to rule disease in/out or determine/defer care.

## Reproducible training

From `eye/backend/`, after installing `requirements.txt` and ensuring the
licensed dataset layout is present at `../../SIHDatasets/idrid`:

```powershell
python -m app.ml.classification.trainer --seed 42
```

This command requires PyTorch/torchvision, scikit-learn, OpenCV, Pillow, and
the training data. ImageNet initialization may download pretrained weights
unless `--no_pretrained` is supplied. The command saves a checkpoint and
`*.evaluation.json` report under `ml/weights/`. Generated checkpoints are
ignored by Git. Do not report metrics until the command completes and the
evaluation report has been checked.

## Evaluation still required

- Independently rerun the official test evaluation once, after all model and
  preprocessing decisions are frozen; disclose small per-grade sample counts.
- Report per-class sensitivity/specificity, precision/recall, macro/weighted
  F1, quadratic weighted kappa, confusion matrix, and uncertainty intervals.
- Fit and evaluate calibration on a separate calibration partition; report
  reliability and calibration error with methodology. Do not tune on the
  official test partition.
- Validate image-quality rejection, subgroup performance, camera/site shift,
  external datasets, and prospective clinical workflow.
- Validate Grad-CAM as an explanation method; an attention map is not proof
  that a lesion was detected or that the classification is correct.
- Obtain clinical/regulatory review before making diagnostic, triage, or
  referral claims.
