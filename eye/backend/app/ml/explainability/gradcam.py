import cv2
import numpy as np
import torch
import torch.nn.functional as F
from typing import Dict, Any, List, Tuple
from app.ml.classification.model import DiabeticRetinopathyClassifier

class GradCAM:
    """
    Gradient-weighted Class Activation Mapping (Grad-CAM) for deep convolutional neural networks.
    Provides visual explanation by highlighting discriminative retinal regions that influenced the model's prediction.
    """
    def __init__(self, model: DiabeticRetinopathyClassifier, target_layer=None):
        self.model = model
        # For EfficientNet-B0, the last convolutional feature block is features[-1] (features.8)
        self.target_layer = target_layer or self.model.backbone.features[-1]
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_in, grad_out):
            # grad_out[0] contains the gradients of the score with respect to feature maps
            self.gradients = grad_out[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: int = None
    ) -> Tuple[np.ndarray, np.ndarray, List[Dict[str, Any]]]:
        """
        Generates 2D Grad-CAM heatmap array normalized [0, 1] and extracts peak attention hotspots.
        """
        self.model.eval()
        self.model.zero_grad()
        
        # Ensure input tensor requires gradients
        input_tensor.requires_grad_(True)
        logits = self.model(input_tensor)
        
        if target_class is None:
            target_class = int(torch.argmax(logits, dim=-1).item())

        score = logits[0, target_class]
        score.backward()

        if self.gradients is None or self.activations is None:
            raise RuntimeError("Gradients or activations were not captured by hooks.")

        # Global average pooling of gradients to obtain neuron importance weights
        # gradients shape: [1, C, H, W]
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        
        # Weighted linear combination of forward activation maps
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = F.relu(cam)  # Only features that have a positive influence on the class
        
        cam_np = cam.squeeze().cpu().numpy()
        
        # Normalize heatmap to [0, 1]
        cam_min, cam_max = np.min(cam_np), np.max(cam_np)
        if cam_max - cam_min > 1e-8:
            cam_norm = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_norm = np.zeros_like(cam_np)

        # Detect peak attention hotspots (coordinates normalized 0-100%)
        hotspots = self._extract_hotspots(cam_norm)

        return cam_norm, logits.detach().cpu().numpy()[0], hotspots

    def _extract_hotspots(self, cam_norm: np.ndarray) -> List[Dict[str, Any]]:
        """
        Finds local maximum activation regions to map to clinical anatomical coordinates.
        """
        h, w = cam_norm.shape
        threshold = 0.65
        binary = (cam_norm > threshold).astype(np.uint8)
        
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        hotspots = []

        for i, c in enumerate(contours):
            M = cv2.moments(c)
            if M["m00"] > 0:
                cx = (M["m10"] / M["m00"]) / w * 100.0
                cy = (M["m01"] / M["m00"]) / h * 100.0
                intensity = float(cam_norm[int(cy * h / 100.0), int(cx * w / 100.0)])
                hotspots.append({
                    "x": round(cx, 1),
                    "y": round(cy, 1),
                    "intensity": round(intensity, 2),
                    "feature": "Model attention region"
                })

        # Fallback if no distinct contour was above threshold
        if not hotspots:
            max_pos = np.unravel_index(np.argmax(cam_norm), cam_norm.shape)
            hotspots.append({
                "x": round((max_pos[1] / w) * 100.0, 1),
                "y": round((max_pos[0] / h) * 100.0, 1),
                "intensity": round(float(np.max(cam_norm)), 2),
                "feature": "Model attention region"
            })

        return sorted(hotspots, key=lambda x: x["intensity"], reverse=True)[:3]

    @staticmethod
    def overlay_heatmap(
        original_bgr: np.ndarray,
        cam_norm: np.ndarray,
        alpha: float = 0.45,
        colormap: int = cv2.COLORMAP_JET
    ) -> np.ndarray:
        """
        Resizes heatmap to original image size, applies colormap, and blends with original.
        """
        h, w = original_bgr.shape[:2]
        cam_resized = cv2.resize(cam_norm, (w, h), interpolation=cv2.INTER_LINEAR)
        cam_uint8 = np.uint8(255 * cam_resized)
        
        heatmap_color = cv2.applyColorMap(cam_uint8, colormap)
        
        # Mask out black background so heatmap is only on the retina
        gray = cv2.cvtColor(original_bgr, cv2.COLOR_BGR2GRAY)
        _, retina_mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
        
        overlay = cv2.addWeighted(original_bgr, 1.0 - alpha, heatmap_color, alpha, 0)
        # Keep background clean black
        overlay[retina_mask == 0] = original_bgr[retina_mask == 0]
        
        return overlay
