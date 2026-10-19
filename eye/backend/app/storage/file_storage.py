import os
import uuid
import shutil
import cv2
import numpy as np
from PIL import Image
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class FileStorageService:
    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or settings.STORAGE_DIR
        self.categories = ["original", "enhanced", "gradcam", "evidence"]
        self._ensure_directories()

    def _ensure_directories(self):
        for cat in self.categories:
            cat_dir = os.path.join(self.base_dir, cat)
            os.makedirs(cat_dir, exist_ok=True)

    def save_upload(self, upload_file: UploadFile, category: str = "original") -> dict:
        if category not in self.categories:
            category = "original"
            
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if not ext or ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
            ext = ".jpg"
            
        unique_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(self.base_dir, category, unique_name)

        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        # Validate that the file is indeed a valid image
        try:
            with Image.open(target_path) as img:
                img.verify()
            with Image.open(target_path) as img:
                width, height = img.size
                mime = img.format.lower()
        except Exception as e:
            if os.path.exists(target_path):
                os.remove(target_path)
            raise HTTPException(
                status_code=400,
                detail=f"The uploaded file is corrupt or not a recognized image: {str(e)}"
            )

        file_size = os.path.getsize(target_path)
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            os.remove(target_path)
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
            )

        # URL path served by FastAPI static mount
        url = f"/storage/{category}/{unique_name}"
        return {
            "file_path": target_path,
            "filename": unique_name,
            "url": url,
            "width": width,
            "height": height,
            "size_bytes": file_size,
            "mime_type": f"image/{mime}"
        }

    def save_numpy_image(self, img_array: np.ndarray, category: str, extension: str = ".jpg") -> dict:
        if category not in self.categories:
            category = "enhanced"
            
        unique_name = f"{uuid.uuid4().hex}{extension}"
        target_path = os.path.join(self.base_dir, category, unique_name)
        
        # Ensure BGR format for cv2.imwrite
        if len(img_array.shape) == 2:
            cv2.imwrite(target_path, img_array)
        elif len(img_array.shape) == 3:
            # Check if RGB needs conversion to BGR
            cv2.imwrite(target_path, img_array)

        url = f"/storage/{category}/{unique_name}"
        return {
            "file_path": target_path,
            "filename": unique_name,
            "url": url,
            "width": img_array.shape[1],
            "height": img_array.shape[0]
        }

    def get_absolute_path(self, relative_url_or_path: str) -> str:
        if relative_url_or_path.startswith("/storage/"):
            parts = relative_url_or_path.replace("/storage/", "")
            return os.path.join(self.base_dir, parts)
        return relative_url_or_path

storage_service = FileStorageService()
