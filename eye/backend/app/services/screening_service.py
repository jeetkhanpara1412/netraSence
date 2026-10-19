import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.db.models import (
    Patient,
    Screening,
    FundusImage,
    ImageQualityResult,
    AIPrediction,
    LesionFinding,
    StructureFinding,
    Explanation,
    DoctorReview,
    AuditEvent
)
from app.storage.file_storage import storage_service
from app.services.quality_service import quality_service
from app.services.ai_service import ai_service
from app.services.explainability_service import explainability_service
from app.services.lesion_service import lesion_service
from app.schemas.doctor_review import DoctorReviewCreate

class ScreeningService:
    def upload_and_create_screening(
        self,
        db: Session,
        upload_file: UploadFile,
        patient_name: str = "Not provided",
        patient_id_ext: Optional[str] = None,
        age: Optional[int] = None,
        gender: str = "Not provided",
        eye: str = "Not provided",
        camera_model: str = "Not provided",
        operator_name: str = "Not provided",
        diabetes_duration: Optional[str] = None,
        hba1c: Optional[str] = None,
        systemic_bp: Optional[str] = None,
        phc_center: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Store original file
        saved_img = storage_service.save_upload(upload_file, category="original")

        # 2. Find or create patient
        ext_id = patient_id_ext or f"LOCAL-{uuid.uuid4().hex[:8].upper()}"
        patient = db.query(Patient).filter(Patient.external_id == ext_id).first()
        if not patient:
            patient = Patient(
                external_id=ext_id,
                name=patient_name,
                age=age,
                gender=gender,
                diabetes_duration=diabetes_duration,
                hba1c=hba1c,
                systemic_bp=systemic_bp,
                phc_center=phc_center
            )
            db.add(patient)
            db.flush()

        # 3. Create screening record
        now = datetime.now(timezone.utc)
        screening_code = f"SCN-{now.year}-{uuid.uuid4().hex[:4].upper()}"
        exam_date_str = now.strftime("%d-%b-%Y %I:%M %p")
        
        screening = Screening(
            screening_code=screening_code,
            patient_id=patient.id,
            status="UPLOADED",
            eye=eye,
            camera_model=camera_model,
            operator_name=operator_name,
            exam_date=exam_date_str
        )
        db.add(screening)
        db.flush()

        # 4. Create fundus image record
        fundus_img = FundusImage(
            screening_id=screening.id,
            original_path=saved_img["file_path"],
            original_filename=saved_img["filename"],
            file_size_bytes=saved_img["size_bytes"],
            mime_type=saved_img["mime_type"],
            width=saved_img["width"],
            height=saved_img["height"]
        )
        db.add(fundus_img)

        # 5. Run automatic quality assessment upon upload
        quality_res = quality_service.assess_image_file(saved_img["file_path"])
        quality_db = ImageQualityResult(
            screening_id=screening.id,
            overall_score=quality_res["overall_score"],
            focus_score=quality_res["focus_score"],
            illumination_score=quality_res["illumination_score"],
            field_of_view_score=quality_res["field_of_view_score"],
            contrast_score=quality_res["contrast_score"],
            artifacts_score=quality_res["artifacts_score"],
            is_gradable=quality_res["is_gradable"],
            status=quality_res["status"],
            clinical_verdict=quality_res["clinical_verdict"],
            recapture_needed=quality_res["recapture_needed"],
            issues=quality_res["issues"],
            metrics=quality_res["metrics"]
        )
        db.add(quality_db)

        # 6. Audit event
        audit = AuditEvent(
            screening_id=screening.id,
            event_type="IMAGE_UPLOADED",
            actor=operator_name,
            role="OPERATOR",
            note=f"Captured {eye} using {camera_model}. Quality verdict: {quality_res['status']} ({quality_res['overall_score']}/100)",
            details={"quality_score": quality_res["overall_score"], "filename": saved_img["filename"]}
        )
        db.add(audit)
        db.commit()

        return self.get_screening_formatted(db, screening.id)

    def analyze_screening(self, db: Session, screening_id: str) -> Dict[str, Any]:
        screening = db.query(Screening).filter(Screening.id == screening_id).first()
        if not screening:
            # Also support finding by screening_code
            screening = db.query(Screening).filter(Screening.screening_code == screening_id).first()
            
        if not screening:
            raise HTTPException(status_code=404, detail=f"Screening with id '{screening_id}' not found.")

        if not screening.images or not screening.images.original_path:
            raise HTTPException(status_code=400, detail="No fundus image found for this screening session.")

        image_path = screening.images.original_path

        # 1. Quality gate check
        if screening.quality and not screening.quality.is_gradable:
            screening.status = "UNGRADABLE"
            audit_ungradable = AuditEvent(
                screening_id=screening.id,
                event_type="ANALYSIS_SUPPRESSED",
                actor="AutoQuality Engine",
                role="SYSTEM",
                note="Inference suppressed: image failed quality threshold."
            )
            db.add(audit_ungradable)
            db.commit()
            return self.get_screening_formatted(db, screening.id)

        # 2. Run real AI classification model
        prediction_result = ai_service.predict_image(image_path)
        pred_grade = prediction_result["predicted_grade"]

        # 3. Generate authentic Grad-CAM explainability
        explanation_result = explainability_service.generate_explanations(image_path, predicted_class=pred_grade)

        # Update fundus image paths with generated assets
        screening.images.enhanced_path = storage_service.get_absolute_path(explanation_result["enhanced_url"])
        screening.images.gradcam_path = storage_service.get_absolute_path(explanation_result["gradcam_url"])
        screening.images.evidence_path = storage_service.get_absolute_path(explanation_result["evidence_url"])

        # 4. Pluggable lesion detection
        lesion_findings = lesion_service.analyze(None)

        # 5. Persist or update AI Prediction
        existing_pred = db.query(AIPrediction).filter(AIPrediction.screening_id == screening.id).first()
        if existing_pred:
            existing_pred.predicted_grade = pred_grade
            existing_pred.severity_label = prediction_result["severity_label"]
            existing_pred.icdr_code = prediction_result["icdr_code"]
            existing_pred.confidence = prediction_result["confidence"]
            existing_pred.uncertainty_tier = prediction_result["uncertainty_tier"]
            existing_pred.uncertainty_score = prediction_result["uncertainty_score"]
            existing_pred.referable_status = prediction_result["referable_status"]
            existing_pred.referral_urgency = prediction_result["referral_urgency"]
            existing_pred.recommendation = prediction_result["recommendation"]
            existing_pred.probabilities = prediction_result["probabilities"]
            existing_pred.model_alternatives = prediction_result["model_alternatives"]
            existing_pred.raw_logits = prediction_result["raw_logits"]
        else:
            db_pred = AIPrediction(
                screening_id=screening.id,
                predicted_grade=pred_grade,
                severity_label=prediction_result["severity_label"],
                icdr_code=prediction_result["icdr_code"],
                confidence=prediction_result["confidence"],
                uncertainty_tier=prediction_result["uncertainty_tier"],
                uncertainty_score=prediction_result["uncertainty_score"],
                referable_status=prediction_result["referable_status"],
                referral_urgency=prediction_result["referral_urgency"],
                recommendation=prediction_result["recommendation"],
                probabilities=prediction_result["probabilities"],
                model_alternatives=prediction_result["model_alternatives"],
                raw_logits=prediction_result["raw_logits"]
            )
            db.add(db_pred)

        # 6. Persist Explanation
        existing_exp = db.query(Explanation).filter(Explanation.screening_id == screening.id).first()
        if existing_exp:
            existing_exp.gradcam_url = explanation_result["gradcam_url"]
            existing_exp.target_layer = explanation_result["target_layer"]
            existing_exp.heatmap_description = explanation_result["heatmap_description"]
            existing_exp.attention_hotspots = explanation_result["attention_hotspots"]
            existing_exp.self_validation = explanation_result["self_validation"]
        else:
            db_exp = Explanation(
                screening_id=screening.id,
                gradcam_url=explanation_result["gradcam_url"],
                target_layer=explanation_result["target_layer"],
                heatmap_description=explanation_result["heatmap_description"],
                attention_hotspots=explanation_result["attention_hotspots"],
                self_validation=explanation_result["self_validation"]
            )
            db.add(db_exp)

        # 7. Persist Lesions
        existing_lesions = db.query(LesionFinding).filter(LesionFinding.screening_id == screening.id).first()
        if not existing_lesions:
            db_lesions = LesionFinding(
                screening_id=screening.id,
                status=lesion_findings.get("status", "NOT_AVAILABLE"),
                microaneurysms=lesion_findings["microaneurysms"],
                hemorrhages=lesion_findings["hemorrhages"],
                exudates=lesion_findings["exudates"],
                neovascularization=lesion_findings["neovascularization"],
                evidence_gallery=lesion_findings.get("evidence_gallery", [])
            )
            db.add(db_lesions)

        # 8. Persist Structures if not present
        existing_struct = db.query(StructureFinding).filter(StructureFinding.screening_id == screening.id).first()
        if not existing_struct:
            db_struct = StructureFinding(
                screening_id=screening.id,
                optic_disc={"status": "Not assessed", "cupDiscRatio": None, "visible": None},
                macula_fovea={"status": "Not assessed", "visible": None},
                vessels={"status": "Not assessed", "visible": None}
            )
            db.add(db_struct)

        # 9. Update screening status
        screening.status = "ANALYZED"

        # 10. Audit events
        audit_inf = AuditEvent(
            screening_id=screening.id,
            event_type="AI_INFERENCE_COMPLETED",
            actor="RetinaSight AI Engine",
            role="SYSTEM",
            note=(
                f"EfficientNet-B0 research output: Level {pred_grade}, raw uncalibrated "
                f"score {prediction_result['confidence']}%."
            ),
            details={
                "predicted_grade": pred_grade,
                "raw_softmax_score_uncalibrated": prediction_result["confidence"],
            }
        )
        audit_cam = AuditEvent(
            screening_id=screening.id,
            event_type="GRADCAM_GENERATED",
            actor="Grad-CAM Engine",
            role="SYSTEM",
            note=f"Saliency attention map generated on {explanation_result['target_layer']}.",
            details={"hotspots_count": len(explanation_result["attention_hotspots"])}
        )
        db.add(audit_inf)
        db.add(audit_cam)
        db.commit()

        return self.get_screening_formatted(db, screening.id)

    def submit_doctor_review(self, db: Session, screening_id: str, review_in: DoctorReviewCreate) -> Dict[str, Any]:
        screening = db.query(Screening).filter(Screening.id == screening_id).first()
        if not screening:
            screening = db.query(Screening).filter(Screening.screening_code == screening_id).first()
            
        if not screening:
            raise HTTPException(status_code=404, detail=f"Screening '{screening_id}' not found.")

        is_overridden = bool(
            screening.ai_prediction and review_in.finalDrLevel != screening.ai_prediction.predicted_grade
        )

        existing_review = db.query(DoctorReview).filter(DoctorReview.screening_id == screening.id).first()
        now_dt = datetime.now(timezone.utc)

        if existing_review:
            existing_review.decision = review_in.decision
            existing_review.final_dr_level = review_in.finalDrLevel
            existing_review.urgency = review_in.urgency or (screening.ai_prediction.referral_urgency if screening.ai_prediction else existing_review.urgency)
            existing_review.override_reason = review_in.overrideReason
            existing_review.doctor_notes = review_in.doctorNotes
            existing_review.reviewer_name = review_in.reviewerName or existing_review.reviewer_name
            existing_review.registration_number = review_in.registrationNumber or existing_review.registration_number
            existing_review.review_timestamp = now_dt
            existing_review.is_overridden = is_overridden
        else:
            db_review = DoctorReview(
                screening_id=screening.id,
                decision=review_in.decision,
                final_dr_level=review_in.finalDrLevel,
                urgency=review_in.urgency or (screening.ai_prediction.referral_urgency if screening.ai_prediction else None),
                override_reason=review_in.overrideReason,
                doctor_notes=review_in.doctorNotes,
                reviewer_name=review_in.reviewerName,
                registration_number=review_in.registrationNumber,
                review_timestamp=now_dt,
                is_overridden=is_overridden
            )
            db.add(db_review)

        screening.status = "REVIEWED"

        audit_review = AuditEvent(
            screening_id=screening.id,
            event_type="DOCTOR_REVIEW_SUBMITTED",
            actor=review_in.reviewerName or "Clinician",
            role="DOCTOR",
            note=f"Decision: {review_in.decision}, Final Grade: Level {review_in.finalDrLevel} (Overridden: {is_overridden})",
            details={"decision": review_in.decision, "final_grade": review_in.finalDrLevel}
        )
        db.add(audit_review)
        db.commit()

        return self.get_screening_formatted(db, screening.id)

    def get_screening_formatted(self, db: Session, screening_id: str) -> Dict[str, Any]:
        screening = db.query(Screening).filter(Screening.id == screening_id).first()
        if not screening:
            screening = db.query(Screening).filter(Screening.screening_code == screening_id).first()
            
        if not screening:
            raise HTTPException(status_code=404, detail=f"Screening '{screening_id}' not found.")

        p = screening.patient
        q = screening.quality
        ai = screening.ai_prediction
        exp = screening.explanation
        les = screening.lesion_findings
        struct = screening.structures_findings
        doc = screening.doctor_review
        audits = db.query(AuditEvent).filter(AuditEvent.screening_id == screening.id).order_by(AuditEvent.created_at.asc()).all()

        # Image URLs
        orig_url = f"/storage/original/{screening.images.original_filename}" if screening.images else ""
        enh_url = ""
        grad_url = ""
        evi_url = ""

        if screening.images:
            if screening.images.enhanced_path:
                enh_url = f"/storage/enhanced/{screening.images.enhanced_path.split('/')[-1]}"
            if screening.images.gradcam_path:
                grad_url = f"/storage/gradcam/{screening.images.gradcam_path.split('/')[-1]}"
            if screening.images.evidence_path:
                evi_url = f"/storage/evidence/{screening.images.evidence_path.split('/')[-1]}"

        # Format patient dict matching frontend
        selected_eye = screening.eye if screening.eye in {"OD", "OS"} else None
        eye_label = {
            "OD": "OD (Right Eye)",
            "OS": "OS (Left Eye)",
        }.get(screening.eye, "Eye not provided")
        patient_dict = {
            "id": p.external_id,
            "name": p.name,
            "age": p.age if p.age > 0 else None,
            "gender": p.gender,
            "eye": eye_label,
            "selectedEye": selected_eye,
            "diabetesDuration": p.diabetes_duration,
            "hba1c": p.hba1c,
            "systemicBp": p.systemic_bp,
            "phcCenter": p.phc_center,
            "operator": screening.operator_name,
            "cameraModel": screening.camera_model,
            "examDate": screening.exam_date,
            "previousDate": None,
            "previousDrLevel": None
        }

        # Format quality dict
        quality_dict = None
        if q:
            quality_dict = {
                "overallScore": q.overall_score,
                "status": q.status,
                "clinicalVerdict": q.clinical_verdict,
                "isGradable": q.is_gradable,
                "metrics": q.metrics,
                "recaptureNeeded": q.recapture_needed,
                "issues": q.issues
            }

        # Format AI Result
        ai_dict = None
        if ai:
            ai_dict = {
                "drLevel": ai.predicted_grade,
                "severityLabel": ai.severity_label,
                "icdrCode": ai.icdr_code,
                "referableStatus": ai.referable_status,
                "referralUrgency": ai.referral_urgency,
                "confidence": ai.confidence,
                "uncertaintyTier": ai.uncertainty_tier,
                "uncertaintyScore": ai.uncertainty_score,
                "probabilities": ai.probabilities,
                "recommendation": ai.recommendation
            }

        # Format Explanation
        exp_dict = None
        self_val_dict = None
        if exp:
            exp_dict = {
                "gradcamUrl": exp.gradcam_url,
                "targetLayer": exp.target_layer,
                "heatmapDescription": exp.heatmap_description,
                "attentionHotspots": exp.attention_hotspots
            }
            self_val_dict = exp.self_validation

        # Format Lesions
        les_dict = None
        if les:
            les_dict = {
                "status": les.status,
                "microaneurysms": les.microaneurysms,
                "hemorrhages": les.hemorrhages,
                "exudates": les.exudates,
                "neovascularization": les.neovascularization
            }

        # Format Structures
        struct_dict = None
        if struct:
            struct_dict = {
                "opticDisc": struct.optic_disc,
                "maculaFovea": struct.macula_fovea,
                "vessels": struct.vessels
            }

        # Format Doctor Review
        doc_dict = None
        if doc:
            doc_dict = {
                "decision": doc.decision,
                "finalDrLevel": doc.final_dr_level,
                "urgency": doc.urgency,
                "overrideReason": doc.override_reason,
                "doctorNotes": doc.doctor_notes,
                "reviewerName": doc.reviewer_name,
                "registrationNumber": doc.registration_number,
                "reviewTimestamp": doc.review_timestamp.strftime("%d-%b-%Y %I:%M %p IST") if doc.review_timestamp else ""
            }

        # Format Audit Timeline
        timeline = [
            {
                "time": a.created_at.strftime("%I:%M:%S %p"),
                "action": a.event_type.replace("_", " ").title(),
                "actor": a.actor,
                "note": a.note
            }
            for a in audits
        ]

        # Bilateral container matching frontend expectation
        bilateral_dict = {
            "selectedEye": selected_eye,
            "od": {
                "eyeCode": "OD",
                "label": "Right Eye (OD)",
                "status": "Analyzed" if screening.eye == "OD" and ai else ("Uploaded" if screening.eye == "OD" else "Eye not recorded"),
                "isAnalyzed": screening.eye == "OD" and ai is not None,
                "drLevel": ai.predicted_grade if screening.eye == "OD" and ai else None,
                "severity": ai.severity_label if screening.eye == "OD" and ai else "Pending Acquisition",
                "referable": (ai.predicted_grade >= 2) if screening.eye == "OD" and ai else None,
                "qualityScore": q.overall_score if screening.eye == "OD" and q else None,
                "examDate": screening.exam_date if screening.eye == "OD" else None
            },
            "os": {
                "eyeCode": "OS",
                "label": "Left Eye (OS)",
                "status": "Analyzed" if screening.eye == "OS" and ai else ("Uploaded" if screening.eye == "OS" else "Eye not recorded"),
                "isAnalyzed": screening.eye == "OS" and ai is not None,
                "drLevel": ai.predicted_grade if screening.eye == "OS" and ai else None,
                "severity": ai.severity_label if screening.eye == "OS" and ai else "Pending Acquisition",
                "referable": (ai.predicted_grade >= 2) if screening.eye == "OS" and ai else None,
                "qualityScore": q.overall_score if screening.eye == "OS" and q else None,
                "examDate": screening.exam_date if screening.eye == "OS" else None
            }
        }

        evidence_gallery = []
        if exp and screening.images and screening.images.evidence_path and exp.attention_hotspots:
            hotspot = exp.attention_hotspots[0]
            evidence_gallery.append({
                "id": "ATTENTION-1",
                "name": "Model attention region",
                "location": f"{hotspot['x']}%, {hotspot['y']}%",
                "finding": "Saliency visualization only; this is not a confirmed lesion.",
                "relevance": "Model attention only; clinician interpretation required.",
                "magnification": "Generated ROI crop",
                "badgeColor": "slate",
                "lesionType": "Not assessed",
                "imageUrl": evi_url
            })

        return {
            "id": screening.screening_code,
            "database_id": screening.id,
            "caseType": "REAL_CLINICAL_SCREENING",
            "status": screening.status,
            "patient": patient_dict,
            "bilateral": bilateral_dict,
            "quality": quality_dict,
            "aiResult": ai_dict,
            "modelAlternatives": ai.model_alternatives if ai else None,
            "selfValidation": self_val_dict,
            "explainability": exp_dict,
            "lesions": les_dict,
            "structures": struct_dict,
            "evidenceGallery": evidence_gallery,
            "doctorReview": doc_dict,
            "auditTimeline": timeline,
            "images": {
                "original": orig_url,
                "enhanced": enh_url or None,
                "gradCam": grad_url or None,
                "evidence": evi_url or None
            },
            "presetKey": "CUSTOM"
        }

screening_service = ScreeningService()
