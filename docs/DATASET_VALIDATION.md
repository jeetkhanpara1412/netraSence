# Dataset Validation

## Reproduce

From the repository root with Python and Pillow installed:

```powershell
python eye\backend\scripts\validate_datasets.py
```

The script checks IDRiD grading CSVs and image coverage, decodes supplied
images/masks, validates dimensions, confirms masks contain no more than two
pixel values, checks landmark coordinate bounds, checks
retinal-vessel image/manual/mask pairings, hashes images for exact-content
duplicates and train/test overlap, and verifies that IDRiD license texts are
present. It writes a deterministic structured report to
[`DATASET_VALIDATION.json`](./DATASET_VALIDATION.json). The report contains
dataset filenames and content hashes, but no filesystem-specific absolute paths
or generation timestamp.

## Results in this workspace

The canonical detailed results are in the JSON output. Current expected
inventory:

| Partition/resource | Observed |
|---|---:|
| IDRiD grading training images | 467 images; all decode as RGB, 4288 × 2848 |
| IDRiD labelled training records | 413; grade counts 0: 134, 1: 20, 2: 136, 3: 74, 4: 49 |
| IDRiD training images without a DR grade | 54 |
| IDRiD grading test images | 130 images; all decode as RGB, 4288 × 2848 |
| IDRiD labelled official test records | 103; grade counts 0: 34, 1: 5, 2: 32, 3: 19, 4: 13 |
| IDRiD testing images without a DR grade | 27 |
| IDRiD segmentation masks | Training MA 54, HE 53, EX 54, SE 26, OD 54; testing MA 27, HE 27, EX 27, SE 14, OD 27 |
| IDRiD landmarks | 413 populated training and 103 populated testing rows per landmark type |
| Retinal-vessel images | 20 training triplets and 20 testing image/mask pairs; 565 × 584 |

All these are inventory/format observations, not evidence of model quality.
The JSON validator is the source of truth for failures and the exact file
inventory; rerun it if the data changes.

## Duplicate and licensing notes

The supplied IDRiD image files contain nine exact-byte duplicate groups under
different IDs. Three groups have contradictory labelled grades: two are
within the training partition and one spans training and official test. The
training code excludes the two contradictory training groups and the training
copy overlapping official test, and records those exclusions. It groups
remaining identical training images into the same validation fold. The
official test files and labels are left unchanged.

IDRiD license texts are included under `SIHDatasets/idrid/licenses/` and state
CC BY 4.0. Retain attribution and license notices when using those materials.
No retinal-vessel license text was found in the supplied tree; do not publish
or redistribute those files until their source terms are verified. Dataset
files are not excluded by the root `.gitignore`, so repository-size and
licensing decisions remain explicit.
