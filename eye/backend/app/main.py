import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response

from app.api.api import api_router
from app.core.config import settings
from app.core.rate_limit import RateLimiter, get_client_key
from app.core.security import get_password_hash
from app.db.database import SessionLocal
from app.db.models import User

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("RetinaSight-FastAPI")

rate_limiter = RateLimiter(limit_per_minute=settings.PUBLIC_API_RATE_LIMIT_PER_MINUTE)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)
    for cat in ["original", "enhanced", "gradcam", "evidence"]:
        (Path(settings.STORAGE_DIR) / cat).mkdir(parents=True, exist_ok=True)

    if settings.DEFAULT_ADMIN_PASSWORD:
        db = SessionLocal()
        try:
            if db.query(User).count() == 0:
                admin = User(
                    email=settings.DEFAULT_ADMIN_EMAIL,
                    full_name="RetinaSight Administrator",
                    hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                    role="ADMIN",
                    is_active=True,
                    email_verified=True,
                )
                db.add(admin)
                db.commit()
                logger.info("Bootstrapped default admin user for local development.")
        finally:
            db.close()

    yield
    logger.info("Shutting down RetinaSight AI backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Quality-Aware & Explainable AI for Diabetic Retinopathy Screening in Rural India (SIH26038)",
    lifespan=lifespan,
)


@app.middleware("http")
async def security_headers_and_rate_limiter(request: Request, call_next):
    allowed_paths = {"/api/health"}
    if request.url.path not in allowed_paths and not request.url.path.startswith("/api/auth"):
        client_key = get_client_key(request)
        if not rate_limiter.allow(client_key):
            return Response(status_code=429, content='{"detail": "Rate limit exceeded."}', media_type="application/json")

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' data: blob:; object-src 'none'; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.STORAGE_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "api_prefix": settings.API_V1_STR,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
