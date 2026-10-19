"""Do not create random model weights that could be mistaken for a trained DR model."""


def initialize_baseline_weights():
    raise RuntimeError(
        "Random EfficientNet weights are not a screening model. "
        "Train and evaluate the classifier with "
        "`python -m app.ml.classification.trainer` instead."
    )


if __name__ == "__main__":
    initialize_baseline_weights()
