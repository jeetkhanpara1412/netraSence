import os
import json
from typing import List, Literal, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, model_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "RetinaSight AI - Diabetic Retinopathy Screening Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database Settings
    DATABASE_URL: str = Field(
        default="sqlite:///./retinasight_dev.db",
        description="SQLite is used locally; set a PostgreSQL URL for shared deployments."
    )

    # A configured PostgreSQL failure must not silently send application data to SQLite.
    ALLOW_SQLITE_FALLBACK: bool = False
    ENVIRONMENT: Literal["development", "test", "production"] = "development"

    # Storage Directory
    STORAGE_DIR: str = Field(
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage")),
        description="Directory for image storage"
    )

    # AI / Model Settings
    MODEL_PATH: str = Field(
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ml/weights/efficientnet_b0_dr.pth")),
        description="Path to PyTorch model weights"
    )
    DEVICE: str = "cuda" if os.environ.get("CUDA_VISIBLE_DEVICES") else "cpu"

    # Clinical Decision Support Thresholds
    REFERABLE_DR_THRESHOLD: int = 2
    QUALITY_OVERALL_MIN_SCORE: float = 55.0
    QUALITY_FOCUS_MIN_SCORE: float = 45.0

    # Security / Auth
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DEFAULT_ADMIN_EMAIL: str = "admin@retinasight.local"
    DEFAULT_ADMIN_PASSWORD: str = ""
    AUTH_PASSWORD_RESET_TTL_MINUTES: int = 30
    AUTH_LOCKOUT_ATTEMPTS: int = 5
    AUTH_LOCKOUT_MINUTES: int = 15

    # Upload constraints
    MAX_UPLOAD_SIZE_BYTES: int = 30 * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/tiff"]

    # Developer/public API security
    PUBLIC_API_RATE_LIMIT_PER_MINUTE: int = 60
    MAX_IMAGE_UPLOADS_PER_MINUTE: int = 15
    EMBED_ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.lstrip().startswith("["):
                parsed = json.loads(v)
                if not isinstance(parsed, list) or not all(isinstance(origin, str) for origin in parsed):
                    raise ValueError("CORS_ORIGINS JSON must be an array of strings.")
                return parsed
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list) and all(isinstance(origin, str) for origin in v):
            return v
        raise ValueError("CORS_ORIGINS must be a comma-separated string or an array of strings.")

    @model_validator(mode="after")
    def validate_deployment_settings(self):
        if self.ENVIRONMENT.lower() == "production":
            raise ValueError(
                "Production mode is disabled until authentication and access controls "
                "are implemented for patient, screening, and image-storage endpoints."
            )
        if "*" in self.CORS_ORIGINS:
            raise ValueError("Wildcard CORS origins are not permitted.")
        if self.ENVIRONMENT.lower() != "development" and len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must contain at least 32 characters outside development.")
        if self.ENVIRONMENT.lower() != "development" and self.ALLOW_SQLITE_FALLBACK:
            raise ValueError("SQLite fallback must be disabled outside development.")
        if self.ENVIRONMENT.lower() == "development" and not self.SECRET_KEY:
            self.SECRET_KEY = "retinasight-dev-secret-key-not-for-production"
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
