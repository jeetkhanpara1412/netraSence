from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    name: str = Field(..., example="Example patient")
    age: Optional[int] = Field(None, ge=0, le=125, example=60)
    gender: str = Field(..., example="Not specified")
    external_id: Optional[str] = Field(None, example="SITE-EXAMPLE-001")
    diabetes_duration: Optional[str] = Field(None, example="Enter if known")
    hba1c: Optional[str] = Field(None, example="Enter if known")
    systemic_bp: Optional[str] = Field(None, example="Enter if known")
    phc_center: Optional[str] = Field(None, example="Enter if known")

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
