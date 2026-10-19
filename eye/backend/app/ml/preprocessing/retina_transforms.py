import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image

def crop_retina_circle(image_bgr: np.ndarray, tol: int = 7) -> np.ndarray:
    """
    Crops black borders from fundus photographs using retinal luminance thresholding.
    Based on Ben Graham's retinal preprocessing methodology.
    """
    if len(image_bgr.shape) == 2:
        mask = image_bgr > tol
        return image_bgr[np.ix_(mask.any(1), mask.any(0))]
    
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    mask = gray > tol
    
    check_shape = image_bgr[:, :, 0][np.ix_(mask.any(1), mask.any(0))].shape[0]
    if check_shape == 0:  # Image is too dark, return original
        return image_bgr
    
    img0 = image_bgr[:, :, 0][np.ix_(mask.any(1), mask.any(0))]
    img1 = image_bgr[:, :, 1][np.ix_(mask.any(1), mask.any(0))]
    img2 = image_bgr[:, :, 2][np.ix_(mask.any(1), mask.any(0))]
    
    cropped = np.stack([img0, img1, img2], axis=-1)
    return cropped

def apply_clahe_enhancement(image_bgr: np.ndarray, clip_limit: float = 2.5, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE) on the green channel.
    The green channel provides the highest contrast between blood vessels, hemorrhages, exudates, and the retinal fundus background.
    """
    # Convert BGR to LAB color space
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    cl = clahe.apply(l_channel)
    
    # Merge channels and convert back to BGR
    enhanced_lab = cv2.merge((cl, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    return enhanced_bgr

def extract_green_clahe(image_bgr: np.ndarray) -> np.ndarray:
    """
    Isolates green channel and enhances microvascular structures.
    """
    green_channel = image_bgr[:, :, 1]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_green = clahe.apply(green_channel)
    # Return as 3-channel for visualization display
    return cv2.cvtColor(enhanced_green, cv2.COLOR_GRAY2BGR)

# Standard PyTorch normalization transforms for inference
INFERENCE_TRANSFORMS = transforms.Compose([
    transforms.Resize((512, 512)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def preprocess_for_inference(image_bgr: np.ndarray, target_size: int = 512) -> torch.Tensor:
    """
    Preprocesses a raw BGR fundus image into a normalized 4D PyTorch tensor (1, C, H, W).
    """
    cropped = crop_retina_circle(image_bgr)
    resized = cv2.resize(cropped, (target_size, target_size), interpolation=cv2.INTER_AREA)
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    tensor = INFERENCE_TRANSFORMS(pil_img).unsqueeze(0)
    return tensor
