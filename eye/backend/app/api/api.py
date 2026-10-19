from fastapi import APIRouter
from app.api.endpoints import auth, developer, health, screening, doctor_review, report, patients

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(developer.router)
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(screening.router, tags=["Screening & Inference"])
api_router.include_router(doctor_review.router, tags=["Doctor Review"])
api_router.include_router(report.router, tags=["Clinical Reports"])
api_router.include_router(patients.router, tags=["Patients"])
