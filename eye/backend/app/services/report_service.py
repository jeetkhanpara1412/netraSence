import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import Screening, Report, AuditEvent
from app.services.screening_service import screening_service

class ReportService:
    def get_or_create_report(self, db: Session, screening_id: str) -> Dict[str, Any]:
        screening = db.query(Screening).filter(Screening.id == screening_id).first()
        if not screening:
            screening = db.query(Screening).filter(Screening.screening_code == screening_id).first()
            
        if not screening:
            raise HTTPException(status_code=404, detail=f"Screening '{screening_id}' not found.")

        report = db.query(Report).filter(Report.screening_id == screening.id).first()
        if not report:
            report_code = f"REP-2026-{uuid.uuid4().hex[:4].upper()}"
            report = Report(
                report_code=report_code,
                screening_id=screening.id,
                facility="Not provided",
                nodal_hospital="Not provided"
            )
            db.add(report)

            # Audit event
            audit = AuditEvent(
                screening_id=screening.id,
                event_type="REPORT_GENERATED",
                actor="Clinical Reporting Engine",
                role="SYSTEM",
                note=f"Official Tele-Ophthalmology Report {report_code} compiled."
            )
            db.add(audit)
            db.commit()

        # Build full screening data
        full_screening = screening_service.get_screening_formatted(db, screening.id)
        
        p = full_screening["patient"]
        ai = full_screening.get("aiResult")
        doc = full_screening.get("doctorReview")
        q = full_screening.get("quality")

        final_dr = doc["finalDrLevel"] if doc else (ai["drLevel"] if ai else None)
        severity_by_grade = {
            0: "No Diabetic Retinopathy",
            1: "Mild Non-Proliferative Diabetic Retinopathy (NPDR)",
            2: "Moderate Non-Proliferative Diabetic Retinopathy (NPDR)",
            3: "Severe Non-Proliferative Diabetic Retinopathy (NPDR)",
            4: "Proliferative Diabetic Retinopathy (PDR)",
        }
        final_severity = severity_by_grade.get(final_dr, "Not assessed")
        is_referable = final_dr >= 2 if final_dr is not None else None

        report_data = {
            "reportId": report.report_code,
            "screeningId": screening.screening_code,
            "generatedAt": report.generated_at.strftime("%d-%b-%Y %I:%M %p IST"),
            "facility": {
                "name": report.facility,
                "phcCenter": p.get("phcCenter") or "Not provided",
                "district": "Not provided",
                "nodalHospital": report.nodal_hospital
            },
            "patient": p,
            "clinicalSummary": {
                "finalDrLevel": final_dr,
                "severityLabel": final_severity,
                "icdrStage": f"ICDR Stage {final_dr}" if final_dr is not None else "Not assessed",
                "isReferable": is_referable,
                "referralUrgency": doc.get("urgency") if doc else (ai.get("referralUrgency") if ai else "Not assessed"),
                "doctorDecision": doc.get("decision") if doc else "Pending Specialist Review",
                "doctorNotes": doc.get("doctorNotes") if doc else "No clinician review has been recorded.",
                "isOverridden": (doc.get("finalDrLevel") != ai.get("drLevel")) if (doc and ai) else None,
                "aiConfidence": ai.get("confidence") if ai else None,
                "qualityVerdict": q.get("clinicalVerdict") if q else "Not assessed"
            },
            "images": full_screening["images"],
            "signatures": {
                "teleOphthalmologist": doc.get("reviewerName") if doc else None,
                "registrationNumber": doc.get("registrationNumber") if doc else None,
                "operator": p.get("operator") or "Not provided"
            },
            "screening": full_screening
        }

        return report_data

report_service = ReportService()
