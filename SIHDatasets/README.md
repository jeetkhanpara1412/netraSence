# Dataset Structure

The datasets supplied with this workspace are retained under their actual
original folder names. This README does not imply that all sources permit
redistribution.

## IDRiD

- `idrid/images/training/` and `idrid/images/testing/`: fundus photographs
- `idrid/annotations/grading/`: disease-grading CSV files
- `idrid/annotations/landmarks/fovea/`: fovea-center annotations
- `idrid/annotations/landmarks/optic_disc/`: optic-disc-center annotations
- `idrid/annotations/segmentation/training/` and `testing/`: MA, HE, EX, SE,
  and optic-disc annotation masks
- `idrid/licenses/`: license and attribution text files supplied with IDRiD

The provided IDRiD license files state CC BY 4.0 for the relevant materials.
Retain attribution and license notices. Exact byte-identical images under
different IDs are present; some labelled duplicates have conflicting grades.
The classifier trainer excludes contradictory groups and training images
duplicated in the official test split; see `../docs/DATASET_VALIDATION.md`.

## Retinal vessel

- `retinal_vessel/training/images/`, `manual/`, and `masks/`
- `retinal_vessel/testing/images/` and `masks/`

The supplied set contains 20 training image/manual/mask triplets and 20 testing
image/mask pairs. No license text was found for these assets in the supplied
tree. Verify source and redistribution terms before publishing, sharing, or
using them beyond the permitted scope.

## Reproduce validation

From the repository root, run:

```powershell
python eye\backend\scripts\validate_datasets.py
```

The command writes `docs/DATASET_VALIDATION.json`; see
`docs/DATASET_VALIDATION.md` for the validation scope and observed inventory.
