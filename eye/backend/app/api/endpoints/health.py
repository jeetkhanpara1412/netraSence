import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health", summary="System Health & Diagnostic Check")
def check_health(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as error:
        logger.error("Database health probe failed (%s).", type(error).__name__)
        db_status = "error"

    ai_health = ai_service.is_healthy()
    model_ready = bool(ai_health.get("loaded"))

    return {
        "status": "healthy" if db_status == "ok" and model_ready else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "status": db_status,
        },
        "model": {
            "status": "ready" if model_ready else "unavailable",
        },
        "storage": {"configured": bool(settings.STORAGE_DIR)}
    }
