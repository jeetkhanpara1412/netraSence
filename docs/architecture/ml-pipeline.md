# ML Pipeline Architecture

## Scope

The ML path is separate from the retinal-vessel dataset and the diabetic-retinopathy classification workflow. The project explicitly avoids conflating the two, which is important for correct dataset governance and evaluation.

## Data sources

- `SIHDatasets/idrid/`: disease-grading dataset used for diabetic-retinopathy classification
- `SIHDatasets/retinal_vessel/`: separate vessel-segmentation resource, not used as DR training data

## Pipeline components

The backend ML package contains the pieces needed for a real processing flow:

- preprocessing: image normalization and dataset preparation
- classification: DR grading model logic and training entry points
- explainability: Grad-CAM style or saliency-based groundwork
- quality assessment: image-quality checks for screening suitability
- evaluation: metrics and checkpoint metadata

## Model lifecycle

The settings object points to `MODEL_PATH`, and the application checks model readiness during health assessment. Training is run from `eye/backend` and produces a .pth checkpoint plus an evaluation JSON report. The repo documentation correctly warns that the project is research-only and not clinically validated.

## Safeguards

- No synthetic images are used in place of real retinal images.
- Dataset labels are validated against the supplied source files.
- The official test split is kept separate from training and validation data.
- The application refuses to claim a validated performance result without measured evidence.

## Production next steps

The current workflow supports reproducible research and review flows, but it still needs calibrated probability reporting, independent clinical evaluation, and formal governance around model deployment.
