from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DoctorReviewCreate(BaseModel):
    decision: str = Field(..., example="Accept")  # Accept, Modify, Mark for Review, Refer
    finalDrLevel: int = Field(..., ge=0, le=4, example=2)
    urgency: Optional[str] = Field(None, example="To be determined by the reviewing clinician")
    overrideReason: Optional[str] = Field(None, example="Enter the clinician's reason if the grade is changed")
    doctorNotes: Optional[str] = Field(None, example="Enter the clinician's actual review notes")
    reviewerName: Optional[str] = None
    registrationNumber: Optional[str] = None

class DoctorReviewResponse(BaseModel):
    decision: str
    finalDrLevel: int
    urgency: Optional[str] = None
    overrideReason: Optional[str] = None
    doctorNotes: Optional[str] = None
    reviewerName: Optional[str] = None
    registrationNumber: Optional[str] = None
    reviewTimestamp: str
    status: str = "RECORDED_UNVERIFIED"
