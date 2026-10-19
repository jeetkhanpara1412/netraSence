from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class QualityMetricItem(BaseModel):
    score: float
    status: str
    description: str

class QualityMetrics(BaseModel):
    focus: QualityMetricItem
    illumination: QualityMetricItem
    fieldOfView: QualityMetricItem
    contrast: Optional[QualityMetricItem] = None
    artifacts: Optional[QualityMetricItem] = None

class ImageQualityResponse(BaseModel):
    overallScore: float
    status: str
    clinicalVerdict: str
    isGradable: bool
    metrics: QualityMetrics
    recaptureNeeded: bool
    issues: List[str] = []

class ProbabilityItem(BaseModel):
    level: int
    label: str
    probability: float

class ModelAlternativeItem(BaseModel):
    level: int
    label: str
    probability: float

class ModelAlternatives(BaseModel):
    top: ModelAlternativeItem
    second: ModelAlternativeItem
    third: ModelAlternativeItem
    uncertaintyContext: str

class AIPredictionResponse(BaseModel):
    drLevel: int
    severityLabel: str
    icdrCode: str
    referableStatus: str
    referralUrgency: str
    confidence: float
    uncertaintyTier: str
    uncertaintyScore: float
    probabilities: List[ProbabilityItem]
    modelAlternatives: Optional[ModelAlternatives] = None
    recommendation: Optional[str] = None

class AttentionHotspot(BaseModel):
    x: float
    y: float
    intensity: float
    feature: str

class SelfValidationResponse(BaseModel):
    status: str
    isConsistent: bool
    alignmentScore: Optional[float] = None
    alignmentLevel: Optional[str] = None
    gradcamLesionAlignment: str
    summary: str
    details: str

class ExplainabilityResponse(BaseModel):
    gradcamUrl: str
    targetLayer: str
    heatmapDescription: str
    attentionHotspots: List[AttentionHotspot] = []
    selfValidation: Optional[SelfValidationResponse] = None

class LesionItem(BaseModel):
    code: str
    name: str
    detected: Optional[bool]
    count: str
    severity: str
    regions: List[str] = []
    evidenceIds: List[str] = []

class LesionFindingsResponse(BaseModel):
    status: str = "NOT_AVAILABLE"
    microaneurysms: LesionItem
    hemorrhages: LesionItem
    exudates: LesionItem
    neovascularization: LesionItem
