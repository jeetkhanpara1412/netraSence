/**
 * Mock Clinical Data for SIH 2026 Diabetic Retinopathy Tele-Screening
 * Explainable AI for Diabetic Retinopathy in Rural India (PHC / Vision Centre Deployment)
 * Designed for Ophthalmologist Decision Support — Realistic Clinical Data Model
 */

export const PRESET_CASES = {
  MODERATE_NPDR: {
    id: "SCN-2026-0842",
    caseType: "DEMO_CASE",
    patient: {
      id: "MH-PUNE-88319",
      name: "Rameshwar Patil",
      age: 58,
      gender: "Male",
      eye: "OD (Right Eye)",
      selectedEye: "OD",
      diabetesDuration: "11 years (Type 2 DM)",
      hba1c: "8.4%",
      systemicBp: "138/86 mmHg",
      phcCenter: "Shirur Rural Primary Health Centre, Pune Dist.",
      operator: "Sister Anjali K. (Ophthalmic Assistant)",
      cameraModel: "Forus 3nethra Classic HD Fundus Camera (45° FOV)",
      examDate: "14-Sep-2026 10:15 AM IST",
      previousDate: "18-Oct-2025",
      previousDrLevel: 1
    },
    bilateral: {
      selectedEye: "OD",
      od: {
        eyeCode: "OD",
        label: "Right Eye (OD)",
        status: "Analyzed",
        isAnalyzed: true,
        drLevel: 2,
        severity: "Moderate NPDR",
        referable: true,
        qualityScore: 92,
        examDate: "14-Sep-2026 10:15 AM"
      },
      os: {
        eyeCode: "OS",
        label: "Left Eye (OS)",
        status: "Not Uploaded",
        isAnalyzed: false,
        drLevel: null,
        severity: "Pending Image Acquisition",
        referable: null,
        qualityScore: null,
        examDate: null
      }
    },
    quality: {
      overallScore: 92,
      status: "Good", // "Good" | "Borderline" | "Ungradable"
      clinicalVerdict: "GOOD FOR ANALYSIS",
      isGradable: true,
      metrics: {
        focus: { score: 94, status: "Optimal", description: "Sharp vessel edges and foveal contour" },
        illumination: { score: 90, status: "Good", description: "Uniform macular illumination, minimal shadow" },
        fieldOfView: { score: 95, status: "Full 45°", description: "Centering includes optic disc and macula" },
        contrast: { score: 89, status: "Adequate", description: "Vessel-to-background contrast ratio > 2.8" },
        artifacts: { score: 92, status: "Low", description: "No corneal reflections or dust occlusions" }
      },
      recaptureNeeded: false,
      recaptureGuidance: []
    },
    aiResult: {
      drLevel: 2,
      severityLabel: "Moderate Non-Proliferative Diabetic Retinopathy (NPDR)",
      icdrCode: "ICDR Stage 2",
      referableStatus: "Referable",
      referralUrgency: "Priority (Review within 2-4 weeks)",
      confidence: 88.4,
      uncertaintyTier: "Tier 3: Confident Referable",
      uncertaintyScore: 0.116,
      probabilities: [
        { level: 0, label: "Level 0: No DR", probability: 2.1 },
        { level: 1, label: "Level 1: Mild NPDR", probability: 6.8 },
        { level: 2, label: "Level 2: Moderate NPDR", probability: 88.4 },
        { level: 3, label: "Level 3: Severe NPDR", probability: 2.3 },
        { level: 4, label: "Level 4: Proliferative DR", probability: 0.4 }
      ],
      recommendation: "Refer to District Hospital Ophthalmic Unit for comprehensive dilated slit-lamp biomicroscopy and OCT assessment for macular edema within 3-4 weeks."
    },
    modelAlternatives: {
      top: { level: 2, label: "Level 2: Moderate NPDR", probability: 88.4 },
      second: { level: 1, label: "Level 1: Mild NPDR", probability: 6.8 },
      third: { level: 3, label: "Level 3: Severe NPDR", probability: 2.3 },
      uncertaintyContext: "Neighboring-Grade Uncertainty (Mild vs. Moderate boundary evaluated)"
    },
    selfValidation: {
      status: "Explanation Consistent",
      isConsistent: true,
      alignmentScore: 94,
      alignmentLevel: "HIGH",
      gradcamLesionAlignment: "Aligned",
      summary: "AI attention activation (Grad-CAM) corresponds directly with physical microaneurysms and hard exudate clusters with 94% spatial overlap.",
      details: "Top Grad-CAM gradient activations at [58%, 44%] and [42%, 52%] overlap with marked circinate exudates and blot hemorrhages. No phantom artifact activation detected."
    },
    explainability: {
      heatmapDescription: "Grad-CAM activation highlights dominant clusters around the superior-temporal arcade and parafoveal region, corresponding directly with microvascular anomalies.",
      attentionHotspots: [
        { x: 58, y: 44, intensity: 0.94, feature: "Circinate Ring of Hard Exudates" },
        { x: 42, y: 52, intensity: 0.88, feature: "Dot & Blot Hemorrhages cluster" },
        { x: 63, y: 38, intensity: 0.81, feature: "Microaneurysm focus near arcade" }
      ]
    },
    lesions: {
      microaneurysms: {
        code: "MA",
        name: "Microaneurysms",
        detected: true,
        count: "14 isolated points",
        severity: "Moderate",
        regions: ["Superior-temporal quadrant", "Parafoveal arcade"],
        evidenceIds: ["MA-01", "MA-02", "MA-03"]
      },
      hemorrhages: {
        code: "HE",
        name: "Intraretinal Hemorrhages",
        detected: true,
        count: "7 dot/blot hemorrhages",
        severity: "Moderate (confined to 2 quadrants)",
        regions: ["Temporal", "Inferior-temporal"],
        evidenceIds: ["HE-01", "HE-02"]
      },
      exudates: {
        code: "EX",
        name: "Hard Exudates",
        detected: true,
        count: "Clusters with circinate tendency",
        severity: "Clinically Significant Warning",
        regions: ["500μm from foveal avascular zone edge"],
        evidenceIds: ["EX-01", "EX-02"]
      },
      neovascularization: {
        code: "NV",
        name: "Neovascularization",
        detected: false,
        count: "None detected (NVD / NVE absent)",
        severity: "Negative",
        regions: [],
        evidenceIds: []
      }
    },
    structures: {
      opticDisc: { status: "Well-defined, Sharp margins", cupDiscRatio: "0.35 (Physiological)", visible: true },
      maculaFovea: { status: "Hard exudates encroach within 1 disc diameter of fovea", dmeSuspected: true, visible: true },
      vessels: { status: "Mild venous engorgement along superior branch", avNicking: "Absent", visible: true }
    },
    evidenceGallery: [
      {
        id: "ROI-1",
        name: "Parafoveal Hard Exudate Plaque",
        location: "Temporal to Fovea (Posterior Pole)",
        finding: "Lipoprotein lipid deposits leaked from hyperpermeable capillaries.",
        relevance: "High risk of Diabetic Macular Edema (DME)",
        magnification: "4.5x Zoomed ROI",
        badgeColor: "amber",
        lesionType: "Hard Exudate",
        confidence: 0.94
      },
      {
        id: "ROI-2",
        name: "Superior Arcade Microaneurysms",
        location: "Superior-Temporal Arcade",
        finding: "Focal saccular outpouchings (<125μm diameter) on capillary walls.",
        relevance: "Pathognomonic hallmark of early capillary basement degradation",
        magnification: "5.0x Zoomed ROI",
        badgeColor: "rose",
        lesionType: "Microaneurysm",
        confidence: 0.88
      },
      {
        id: "ROI-3",
        name: "Deep Retinal Blot Hemorrhages",
        location: "Inferior Mid-Periphery",
        finding: "Confined in the inner nuclear and outer plexiform retinal layers.",
        relevance: "Indicates localized retinal ischemia and perfusion deficit",
        magnification: "4.0x Zoomed ROI",
        badgeColor: "red",
        lesionType: "Hemorrhage",
        confidence: 0.91
      }
    ],
    previousScreening: {
      hasPrevious: true,
      examDate: "18-Oct-2025 (11 months ago)",
      center: "Shirur Rural Primary Health Centre",
      drLevel: 1,
      severityLabel: "Mild NPDR (Level 1)",
      findingsSummary: "Isolated microaneurysms only. FAZ was clear; no hard exudates observed in posterior pole.",
      comparisonNote: "Screening result comparison: New hard exudates and dot hemorrhages detected compared with previous screening (18-Oct-2025). Clinical referral indicated."
    },
    reviewPriority: {
      tier: "High Review Priority",
      reasons: [
        "Referable DR classification (ICDR Stage 2)",
        "Circinate hard exudate plaque threatening macular avascular zone (< 1 disc diameter)",
        "AI model confidence (88.4%) exceeds automated tele-referral cutoff (80.0%)",
        "Evidence alignment verified: High spatial correlation with physical lesion coordinates"
      ]
    },
    aiLimitations: [
      "The model cannot establish a final clinical diagnosis (screening decision-support only).",
      "The model cannot determine systemic anti-diabetic medication or anti-VEGF injection dosage.",
      "The model cannot predict individual rate of future disease progression or visual acuity loss.",
      "The model cannot replace dilated slit-lamp biomicroscopy or high-resolution macular OCT."
    ],
    modelCard: {
      name: "RetinaNet-XAI (SIH 2026 Edition)",
      version: "v0.1-demo (MobileNetV3 + Saliency Head)",
      architecture: "Edge CNN with Spatial Saliency & Evidential Uncertainty Head",
      input: "Single-field 45° non-mydriatic color fundus photograph (512×512 RGB)",
      output: "ICDR 5-class probability vector, Grad-CAM attention heatmap, lesion ROI masks",
      trainingData: "Kaggle EyePACS (88,702 images) + Messidor-2 (1,748 images) calibrated for Indian cameras",
      validationStatus: "Prototype validation value only. Multi-center rural hospital cohort verification in progress."
    },
    auditTimeline: [
      { time: "10:15:12 AM", action: "Fundus image captured", actor: "Sister Anjali K. (Ophthalmic Assistant)", note: "Forus 3nethra 45°" },
      { time: "10:15:28 AM", action: "Quality assessment completed", actor: "AutoQuality Engine", note: "Score: 92/100 (Gradable)" },
      { time: "10:16:04 AM", action: "RetinaNet-XAI inference completed", actor: "Edge AI Engine", note: "Predicted Level 2 (88.4%)" },
      { time: "10:16:15 AM", action: "Explanation consistency validated", actor: "Self-Validation Module", note: "High Alignment (94%)" },
      { time: "10:17:00 AM", action: "Clinician review initiated", actor: "Dr. Rajesh Sharma, MD", note: "Tele-verification queue" }
    ],
    doctorReview: {
      decision: "Refer", // "Accept" | "Modify" | "Mark for Review" | "Refer"
      finalDrLevel: 2,
      urgency: "Priority (Review within 2-4 weeks)",
      overrideReason: "Clinical review",
      doctorNotes: "AI model findings confirmed. Patient exhibits moderate NPDR with hard exudates threatening macular center. Urgent referral generated for Vitreo-Retinal specialist at Sasoon General Hospital Pune. Advised strict glycemic control and repeat OCT within 3 weeks.",
      reviewerName: "Dr. Rajesh Sharma, MD (Ophthalmology)",
      registrationNumber: "MCI-48920-MH",
      reviewTimestamp: "14-Sep-2026 10:24 AM IST",
      status: "DRAFT"
    }
  },

  SEVERE_NPDR: {
    id: "SCN-2026-0843",
    caseType: "DEMO_CASE",
    patient: {
      id: "MH-SOL-99120",
      name: "Savitri Devi G.",
      age: 64,
      gender: "Female",
      eye: "OS (Left Eye)",
      selectedEye: "OS",
      diabetesDuration: "18 years (Type 2 DM)",
      hba1c: "9.8%",
      systemicBp: "152/94 mmHg",
      phcCenter: "Barshi Tele-Ophthalmology Node, Solapur Dist.",
      operator: "Mr. Ganesh Pawar (Vision Tech)",
      cameraModel: "Remidio NM-FOP Portable Smartphone Fundus",
      examDate: "14-Sep-2026 10:40 AM IST",
      previousDate: "12-Nov-2025",
      previousDrLevel: 2
    },
    bilateral: {
      selectedEye: "OS",
      od: {
        eyeCode: "OD",
        label: "Right Eye (OD)",
        status: "Not Uploaded",
        isAnalyzed: false,
        drLevel: null,
        severity: "Pending Image Acquisition",
        referable: null,
        qualityScore: null,
        examDate: null
      },
      os: {
        eyeCode: "OS",
        label: "Left Eye (OS)",
        status: "Analyzed",
        isAnalyzed: true,
        drLevel: 3,
        severity: "Severe NPDR",
        referable: true,
        qualityScore: 88,
        examDate: "14-Sep-2026 10:40 AM"
      }
    },
    quality: {
      overallScore: 88,
      status: "Good",
      clinicalVerdict: "GOOD FOR ANALYSIS",
      isGradable: true,
      metrics: {
        focus: { score: 89, status: "Good", description: "Central retina clearly visible" },
        illumination: { score: 86, status: "Acceptable", description: "Slight peripheral vignetting" },
        fieldOfView: { score: 92, status: "45° Standard", description: "Disc, macula and temporal arcade included" },
        contrast: { score: 85, status: "Good", description: "Adequate blood vessel delineation" },
        artifacts: { score: 90, status: "Low", description: "Minimal eyelash shadow" }
      },
      recaptureNeeded: false,
      recaptureGuidance: []
    },
    aiResult: {
      drLevel: 3,
      severityLabel: "Severe Non-Proliferative Diabetic Retinopathy (NPDR)",
      icdrCode: "ICDR Stage 3 (4:2:1 Rule triggered)",
      referableStatus: "Referable",
      referralUrgency: "Immediate (Review within 1-2 weeks)",
      confidence: 94.2,
      uncertaintyTier: "Tier 3: Confident Referable",
      uncertaintyScore: 0.058,
      probabilities: [
        { level: 0, label: "Level 0: No DR", probability: 0.2 },
        { level: 1, label: "Level 1: Mild NPDR", probability: 0.8 },
        { level: 2, label: "Level 2: Moderate NPDR", probability: 4.8 },
        { level: 3, label: "Level 3: Severe NPDR", probability: 94.2 },
        { level: 4, label: "Level 4: Proliferative DR", probability: 0.0 }
      ],
      recommendation: "URGENT referral to Vitreoretinal clinic for evaluation of pan-retinal photocoagulation (PRP) or anti-VEGF intervention before progression to proliferative disease."
    },
    modelAlternatives: {
      top: { level: 3, label: "Level 3: Severe NPDR", probability: 94.2 },
      second: { level: 2, label: "Level 2: Moderate NPDR", probability: 4.8 },
      third: { level: 1, label: "Level 1: Mild NPDR", probability: 0.8 },
      uncertaintyContext: "Decisive Multi-Quadrant Hemorrhage Pattern"
    },
    selfValidation: {
      status: "Explanation Consistent",
      isConsistent: true,
      alignmentScore: 96,
      alignmentLevel: "VERY HIGH",
      gradcamLesionAlignment: "Aligned",
      summary: "Grad-CAM attention overlays all 4 quadrants with high-density activation over dense intraretinal blot hemorrhages and venous beading.",
      details: "High activation matches 4:2:1 rule criteria: extensive blot hemorrhages in >4 sectors and venous beading along infero-temporal vein."
    },
    explainability: {
      heatmapDescription: "Grad-CAM displays multi-quadrant dense activation overlays covering all 4 quadrants with pronounced response over multiple blot hemorrhages and venous beading.",
      attentionHotspots: [
        { x: 35, y: 30, intensity: 0.96, feature: "Widespread Flame & Blot Hemorrhages in >4 quadrants" },
        { x: 68, y: 62, intensity: 0.92, feature: "Venous beading along infero-temporal vein" },
        { x: 50, y: 70, intensity: 0.89, feature: "Cotton wool spots (axoplasmic stasis)" }
      ]
    },
    lesions: {
      microaneurysms: {
        code: "MA",
        name: "Microaneurysms",
        detected: true,
        count: ">30 widespread lesions",
        severity: "Severe",
        regions: ["All 4 retinal quadrants"],
        evidenceIds: ["MA-S1", "MA-S2"]
      },
      hemorrhages: {
        code: "HE",
        name: "Intraretinal Hemorrhages",
        detected: true,
        count: ">20 intraretinal hemorrhages in each of 4 quadrants",
        severity: "Severe (Meets ICDR 4-quadrant rule)",
        regions: ["Superior, Inferior, Nasal, Temporal"],
        evidenceIds: ["HE-S1", "HE-S2", "HE-S3"]
      },
      exudates: {
        code: "EX",
        name: "Hard & Soft Exudates",
        detected: true,
        count: "Multiple soft exudates (Cotton wool spots)",
        severity: "High (Nerve fiber layer infarction)",
        regions: ["Nerve fiber bundle layer around arcade"],
        evidenceIds: ["EX-S1"]
      },
      neovascularization: {
        code: "NV",
        name: "Neovascularization",
        detected: false,
        count: "No definite NVD/NVE visible on 45° field",
        severity: "Borderline / High Pre-proliferative Risk",
        regions: ["Requires FA verification"],
        evidenceIds: []
      }
    },
    structures: {
      opticDisc: { status: "Mild disc hyperaemia, cup-disc ratio 0.4", cupDiscRatio: "0.40", visible: true },
      maculaFovea: { status: "DME highly suspected; diffuse edema halo", dmeSuspected: true, visible: true },
      vessels: { status: "Marked venous beading and localized caliber variations", avNicking: "Present", visible: true }
    },
    evidenceGallery: [
      {
        id: "ROI-A",
        name: "Venous Beading & Sausageing",
        location: "Infero-Temporal Main Trunk",
        finding: "Irregular venous caliber fluctuations reflecting severe tissue hypoxia.",
        relevance: "Key criteria in ICDR 4:2:1 rule for severe progression",
        magnification: "4.8x Zoomed ROI",
        badgeColor: "rose",
        lesionType: "Venous Beading",
        confidence: 0.95
      },
      {
        id: "ROI-B",
        name: "Cotton Wool Spot Infarction",
        location: "Supero-Nasal Peripapillary",
        finding: "Axoplasmic flow blockage in retinal nerve fiber layer due to arteriolar occlusion.",
        relevance: "Marks severe ischemic breakdown in microcirculation",
        magnification: "5.2x Zoomed ROI",
        badgeColor: "purple",
        lesionType: "Soft Exudate (CWS)",
        confidence: 0.91
      },
      {
        id: "ROI-C",
        name: "Dense Multi-Quadrant Blot Hemorrhages",
        location: "Mid-Peripheral Retina",
        finding: "Confluent blot hemorrhages across > 4 retinal sectors.",
        relevance: "Meets primary threshold for severe non-proliferative disease",
        magnification: "3.8x Zoomed ROI",
        badgeColor: "red",
        lesionType: "Blot Hemorrhage",
        confidence: 0.97
      }
    ],
    previousScreening: {
      hasPrevious: true,
      examDate: "12-Nov-2025 (10 months ago)",
      center: "Barshi Tele-Ophthalmology Node",
      drLevel: 2,
      severityLabel: "Moderate NPDR (Level 2)",
      findingsSummary: "Moderate blot hemorrhages in 2 quadrants. Venous beading was absent.",
      comparisonNote: "Screening result comparison: New venous beading and 4-quadrant blot hemorrhages detected compared with previous screening (12-Nov-2025). Urgent specialist intervention required."
    },
    reviewPriority: {
      tier: "Urgent Review Priority",
      reasons: [
        "Severe NPDR classification (ICDR Stage 3 - 4:2:1 rule)",
        "High imminent risk of conversion to Proliferative DR (50% at 1 year)",
        "Confidence 94.2% with very low entropy uncertainty (0.058)",
        "Venous beading confirmed on infero-temporal trunk"
      ]
    },
    aiLimitations: [
      "The model cannot establish a final clinical diagnosis (screening decision-support only).",
      "The model cannot verify peripheral neovascularization outside the standard 45° photographic field.",
      "The model cannot determine laser photocoagulation parameters or surgical vitrectomy candidacy."
    ],
    modelCard: {
      name: "RetinaNet-XAI (SIH 2026 Edition)",
      version: "v0.1-demo (MobileNetV3 + Saliency Head)",
      architecture: "Edge CNN with Spatial Saliency & Evidential Uncertainty Head",
      input: "Single-field 45° non-mydriatic color fundus photograph (512×512 RGB)",
      output: "ICDR 5-class probability vector, Grad-CAM attention heatmap, lesion ROI masks",
      trainingData: "Kaggle EyePACS (88,702 images) + Messidor-2 (1,748 images) calibrated for Indian cameras",
      validationStatus: "Prototype validation value only. Multi-center rural hospital cohort verification in progress."
    },
    auditTimeline: [
      { time: "10:40:02 AM", action: "Fundus image captured", actor: "Mr. Ganesh Pawar (Vision Tech)", note: "Remidio NM-FOP" },
      { time: "10:40:19 AM", action: "Quality check completed", actor: "AutoQuality Engine", note: "Score: 88/100 (Gradable)" },
      { time: "10:40:55 AM", action: "RetinaNet-XAI inference completed", actor: "Edge AI Engine", note: "Predicted Level 3 (94.2%)" },
      { time: "10:41:08 AM", action: "Explanation consistency validated", actor: "Self-Validation Module", note: "Very High Alignment (96%)" },
      { time: "10:42:00 AM", action: "Clinician review initiated", actor: "Dr. Rajesh Sharma, MD", note: "Urgent queue flag" }
    ],
    doctorReview: {
      decision: "Refer",
      finalDrLevel: 3,
      urgency: "Immediate (Review within 1-2 weeks)",
      overrideReason: "Clinical review",
      doctorNotes: "Severe NPDR confirmed. 4:2:1 criteria satisfied. Immediate referral letter issued for District Vitreo-Retinal Unit at Sasoon General Hospital. Patient escorted to telemedicine tele-consultation cabin.",
      reviewerName: "Dr. Rajesh Sharma, MD (Ophthalmology)",
      registrationNumber: "MCI-48920-MH",
      reviewTimestamp: "14-Sep-2026 10:48 AM IST",
      status: "DRAFT"
    }
  },

  NORMAL: {
    id: "SCN-2026-0844",
    caseType: "DEMO_CASE",
    patient: {
      id: "MH-SAT-10492",
      name: "Abdul Qayyum Sheikh",
      age: 49,
      gender: "Male",
      eye: "OD (Right Eye)",
      selectedEye: "OD",
      diabetesDuration: "3 years (Type 2 DM, Diet Controlled)",
      hba1c: "6.5%",
      systemicBp: "122/78 mmHg",
      phcCenter: "Karad Vision Centre, Satara Dist.",
      operator: "Brother Sunil Thorat (Health Worker)",
      cameraModel: "Remidio NM-FOP Portable Fundus",
      examDate: "14-Sep-2026 11:10 AM IST",
      previousDate: "15-Sep-2025",
      previousDrLevel: 0
    },
    bilateral: {
      selectedEye: "OD",
      od: {
        eyeCode: "OD",
        label: "Right Eye (OD)",
        status: "Analyzed",
        isAnalyzed: true,
        drLevel: 0,
        severity: "No Apparent DR",
        referable: false,
        qualityScore: 96,
        examDate: "14-Sep-2026 11:10 AM"
      },
      os: {
        eyeCode: "OS",
        label: "Left Eye (OS)",
        status: "Not Uploaded",
        isAnalyzed: false,
        drLevel: null,
        severity: "Pending Image Acquisition",
        referable: null,
        qualityScore: null,
        examDate: null
      }
    },
    quality: {
      overallScore: 96,
      status: "Good",
      clinicalVerdict: "GOOD FOR ANALYSIS",
      isGradable: true,
      metrics: {
        focus: { score: 98, status: "Excellent", description: "Superb retinal nerve layer definition" },
        illumination: { score: 95, status: "Optimal", description: "Balanced tone across fundus" },
        fieldOfView: { score: 97, status: "Full 45°", description: "Complete posterior pole and macula visible" },
        contrast: { score: 94, status: "High", description: "Clear vessel branches down to tertiary order" },
        artifacts: { score: 98, status: "None", description: "Crystal clear optical field" }
      },
      recaptureNeeded: false,
      recaptureGuidance: []
    },
    aiResult: {
      drLevel: 0,
      severityLabel: "No Apparent Diabetic Retinopathy (Normal)",
      icdrCode: "ICDR Stage 0",
      referableStatus: "Non-Referable",
      referralUrgency: "Routine (Annual follow-up)",
      confidence: 97.6,
      uncertaintyTier: "Tier 1: Confident Normal",
      uncertaintyScore: 0.024,
      probabilities: [
        { level: 0, label: "Level 0: No DR", probability: 97.6 },
        { level: 1, label: "Level 1: Mild NPDR", probability: 1.8 },
        { level: 2, label: "Level 2: Moderate NPDR", probability: 0.4 },
        { level: 3, label: "Level 3: Severe NPDR", probability: 0.2 },
        { level: 4, label: "Level 4: Proliferative DR", probability: 0.0 }
      ],
      recommendation: "No diabetic retinopathy microvascular signs observed. Encourage continued diet management, blood pressure & HbA1c control (<7.0%), and re-screen in 12 months at the local Vision Centre."
    },
    modelAlternatives: {
      top: { level: 0, label: "Level 0: No DR", probability: 97.6 },
      second: { level: 1, label: "Level 1: Mild NPDR", probability: 1.8 },
      third: { level: 2, label: "Level 2: Moderate NPDR", probability: 0.4 },
      uncertaintyContext: "High-Confidence Healthy Baseline"
    },
    selfValidation: {
      status: "Explanation Consistent",
      isConsistent: true,
      alignmentScore: 98,
      alignmentLevel: "OPTIMAL",
      gradcamLesionAlignment: "Aligned",
      summary: "Grad-CAM activation exhibits minimal baseline response across the posterior pole with zero focal pathological hotspots, consistent with Level 0 classification.",
      details: "Absence of pathological Grad-CAM attention aligns 100% with the absence of microaneurysms, hemorrhages, or exudates."
    },
    explainability: {
      heatmapDescription: "Grad-CAM exhibits minimal baseline neural response across posterior pole with zero pathological focus.",
      attentionHotspots: []
    },
    lesions: {
      microaneurysms: { code: "MA", name: "Microaneurysms", detected: false, count: "None", severity: "Normal", regions: [], evidenceIds: [] },
      hemorrhages: { code: "HE", name: "Intraretinal Hemorrhages", detected: false, count: "None", severity: "Normal", regions: [], evidenceIds: [] },
      exudates: { code: "EX", name: "Hard Exudates", detected: false, count: "None", severity: "Normal", regions: [], evidenceIds: [] },
      neovascularization: { code: "NV", name: "Neovascularization", detected: false, count: "None", severity: "Normal", regions: [], evidenceIds: [] }
    },
    structures: {
      opticDisc: { status: "Healthy pink neuroretinal rim, well-defined margin", cupDiscRatio: "0.30", visible: true },
      maculaFovea: { status: "Sharp foveal reflex present, no thickening or edema", dmeSuspected: false, visible: true },
      vessels: { status: "Normal A:V ratio 2:3, regular branching pattern", avNicking: "Absent", visible: true }
    },
    evidenceGallery: [
      {
        id: "ROI-N1",
        name: "Healthy Foveal Avascular Zone (FAZ)",
        location: "Central Macula",
        finding: "Normal dark foveal depression with sharp central light reflex.",
        relevance: "Preserved visual acuity; no macular leakage.",
        magnification: "4.0x Zoomed ROI",
        badgeColor: "emerald",
        lesionType: "Healthy Macula",
        confidence: 0.98
      },
      {
        id: "ROI-N2",
        name: "Normal Optic Disc Margin",
        location: "Nasal Posterior Pole",
        finding: "Crisp pink rim with physiological cupping and healthy central vessels.",
        relevance: "No glaucomatous cupping or neovascularization of disc (NVD)",
        magnification: "4.2x Zoomed ROI",
        badgeColor: "emerald",
        lesionType: "Healthy Disc",
        confidence: 0.99
      }
    ],
    previousScreening: {
      hasPrevious: true,
      examDate: "15-Sep-2025 (12 months ago)",
      center: "Karad Vision Centre",
      drLevel: 0,
      severityLabel: "No Apparent DR (Level 0)",
      findingsSummary: "Normal fundus exam. No microaneurysms detected.",
      comparisonNote: "Screening result comparison: Stable retinal findings compared with previous screening (15-Sep-2025). No new lesions detected."
    },
    reviewPriority: {
      tier: "Low Review Priority (Safe to Clear)",
      reasons: [
        "Non-referable screening result (ICDR Stage 0)",
        "AI model confidence 97.6% (Tier 1: Confident Normal)",
        "Zero microvascular lesions detected across all quadrants",
        "Consistent explanation with clean baseline neural response"
      ]
    },
    aiLimitations: [
      "The model cannot detect non-diabetic conditions (e.g. peripheral retinal tears or early glaucoma).",
      "Annual screening protocol remains mandatory even with normal current result."
    ],
    modelCard: {
      name: "RetinaNet-XAI (SIH 2026 Edition)",
      version: "v0.1-demo (MobileNetV3 + Saliency Head)",
      architecture: "Edge CNN with Spatial Saliency & Evidential Uncertainty Head",
      input: "Single-field 45° non-mydriatic color fundus photograph (512×512 RGB)",
      output: "ICDR 5-class probability vector, Grad-CAM attention heatmap, lesion ROI masks",
      trainingData: "Kaggle EyePACS (88,702 images) + Messidor-2 (1,748 images) calibrated for Indian cameras",
      validationStatus: "Prototype validation value only. Multi-center rural hospital cohort verification in progress."
    },
    auditTimeline: [
      { time: "11:10:04 AM", action: "Fundus image captured", actor: "Brother Sunil Thorat (Health Worker)", note: "Remidio NM-FOP" },
      { time: "11:10:20 AM", action: "Quality check completed", actor: "AutoQuality Engine", note: "Score: 96/100 (Optimal)" },
      { time: "11:10:52 AM", action: "RetinaNet-XAI inference completed", actor: "Edge AI Engine", note: "Predicted Level 0 (97.6%)" },
      { time: "11:11:05 AM", action: "Explanation consistency validated", actor: "Self-Validation Module", note: "Optimal (98%)" },
      { time: "11:12:00 AM", action: "Clinician clearance sign-off", actor: "Dr. Rajesh Sharma, MD", note: "Routine clearance queue" }
    ],
    doctorReview: {
      decision: "Accept",
      finalDrLevel: 0,
      urgency: "Routine (Rescreen in 12 months)",
      overrideReason: "Clinical review",
      doctorNotes: "Normal retinal fundus confirmed. Routine screening interval of 12 months advised. Patient counseled on diet, physical activity, and glycemic maintenance.",
      reviewerName: "Dr. Rajesh Sharma, MD (Ophthalmology)",
      registrationNumber: "MCI-48920-MH",
      reviewTimestamp: "14-Sep-2026 11:15 AM IST",
      status: "DRAFT"
    }
  },

  UNGRADABLE_BLURRED: {
    id: "SCN-2026-0845",
    caseType: "DEMO_CASE",
    patient: {
      id: "MH-PUN-33182",
      name: "Kamalbai Shinde",
      age: 72,
      gender: "Female",
      eye: "OS (Left Eye)",
      selectedEye: "OS",
      diabetesDuration: "14 years (Type 2 DM)",
      hba1c: "8.9%",
      systemicBp: "144/90 mmHg",
      phcCenter: "Bhor Rural Health Outpost, Pune Dist.",
      operator: "Sister Rekha M. (Auxiliary Nurse)",
      cameraModel: "Forus 3nethra Classic HD Fundus Camera",
      examDate: "14-Sep-2026 11:35 AM IST",
      previousDate: null,
      previousDrLevel: null
    },
    bilateral: {
      selectedEye: "OS",
      od: {
        eyeCode: "OD",
        label: "Right Eye (OD)",
        status: "Not Uploaded",
        isAnalyzed: false,
        drLevel: null,
        severity: "Pending Image Acquisition",
        referable: null,
        qualityScore: null,
        examDate: null
      },
      os: {
        eyeCode: "OS",
        label: "Left Eye (OS)",
        status: "Ungradable",
        isAnalyzed: false,
        drLevel: null,
        severity: "Ungradable Image",
        referable: null,
        qualityScore: 38,
        examDate: "14-Sep-2026 11:35 AM"
      }
    },
    quality: {
      overallScore: 38,
      status: "Ungradable",
      clinicalVerdict: "UNGRADABLE — RECAPTURE REQUIRED",
      isGradable: false,
      metrics: {
        focus: { score: 32, status: "Deficient", description: "Severe motion blur / defocus; fine vessels indistinct" },
        illumination: { score: 41, status: "Uneven", description: "Significant optical shadow across macular zone" },
        fieldOfView: { score: 52, status: "Incomplete", description: "Optic disc cut off at nasal margin (<35° captured)" },
        contrast: { score: 28, status: "Poor", description: "Vessel contrast below diagnostic threshold" },
        artifacts: { score: 35, status: "High", description: "Corneal reflection & nuclear cataract haze" }
      },
      recaptureNeeded: true,
      recaptureGuidance: [
        "Patient Movement / Defocus: Instruct patient to fixate firmly on internal green fixation target without blinking during flash.",
        "Pupil Dilatation: If pupil diameter <3.5mm in ambient light, consider 0.5% Tropicamide drops (subject to standing MO orders).",
        "Camera Alignment: Re-center objective lens perpendicular to corneal apex to eliminate superior-temporal corneal reflection artifact.",
        "Lens Cleaning: Inspect fundus camera front optical glass for dust or moisture smudge with lens paper."
      ]
    },
    aiResult: {
      drLevel: null,
      severityLabel: "Ungradable Image — Analysis Blocked for Clinical Safety",
      icdrCode: "Quality Check Failed",
      referableStatus: "Indeterminate (Recapture Required)",
      referralUrgency: "Immediate Recapture on Site",
      confidence: 0.0,
      uncertaintyTier: "Tier 2: Uncertain / Priority Review",
      uncertaintyScore: 1.0,
      probabilities: [
        { level: 0, label: "Level 0: No DR", probability: 0 },
        { level: 1, label: "Level 1: Mild NPDR", probability: 0 },
        { level: 2, label: "Level 2: Moderate NPDR", probability: 0 },
        { level: 3, label: "Level 3: Severe NPDR", probability: 0 },
        { level: 4, label: "Level 4: Proliferative DR", probability: 0 }
      ],
      recommendation: "Do NOT proceed with clinical decision on this image. Follow the on-screen recapture guidance protocol immediately before patient departs the PHC."
    },
    modelAlternatives: {
      top: { level: null, label: "Indeterminate Quality", probability: 0 },
      second: { level: null, label: "Analysis Suspended", probability: 0 },
      third: { level: null, label: "Recapture Mandated", probability: 0 },
      uncertaintyContext: "Clinical Safety Interlock Active"
    },
    selfValidation: {
      status: "Quality Check Failed — Saliency Suppressed",
      isConsistent: false,
      alignmentScore: 0,
      alignmentLevel: "SUPPRESSED",
      gradcamLesionAlignment: "Suppressed",
      summary: "Explainability heatmap and diagnostic inference suppressed due to deficient image quality (< 60%). High optical distortion invalidates feature attribution.",
      details: "Quality score of 38/100 fails the 60.0% gradability threshold. Machine learning prediction is inhibited to prevent false negative clinical harm."
    },
    explainability: {
      heatmapDescription: "Explainability heatmap suppressed due to ungradable image quality index (< 60%). High artifact distortion invalidates feature attribution.",
      attentionHotspots: []
    },
    lesions: {
      microaneurysms: { code: "MA", name: "Microaneurysms", detected: null, count: "Indeterminate", severity: "Unobservable", regions: [], evidenceIds: [] },
      hemorrhages: { code: "HE", name: "Intraretinal Hemorrhages", detected: null, count: "Indeterminate", severity: "Unobservable", regions: [], evidenceIds: [] },
      exudates: { code: "EX", name: "Hard Exudates", detected: null, count: "Indeterminate", severity: "Unobservable", regions: [], evidenceIds: [] },
      neovascularization: { code: "NV", name: "Neovascularization", detected: null, count: "Indeterminate", severity: "Unobservable", regions: [], evidenceIds: [] }
    },
    structures: {
      opticDisc: { status: "Partially obscured by defocus artifact", cupDiscRatio: "Indeterminate", visible: false },
      maculaFovea: { status: "Obscured by shadow artifact", dmeSuspected: null, visible: false },
      vessels: { status: "Blurred / low contrast", avNicking: "Indeterminate", visible: false }
    },
    evidenceGallery: [],
    previousScreening: {
      hasPrevious: false,
      examDate: null,
      center: null,
      drLevel: null,
      severityLabel: null,
      findingsSummary: null,
      comparisonNote: "No previous screening records available for this patient."
    },
    reviewPriority: {
      tier: "Immediate Technical Intervention",
      reasons: [
        "Image fails optical gradability criteria (Focus score: 32/100)",
        "AI inference automatically suspended for patient safety",
        "Operator must execute recapture protocol with fixation guidance"
      ]
    },
    aiLimitations: [
      "The model cannot make clinical predictions on ungradable fundus photographs.",
      "Attempting diagnosis on blurred or occluded images risks life-altering missed referrals."
    ],
    modelCard: {
      name: "RetinaNet-XAI (SIH 2026 Edition)",
      version: "v0.1-demo (MobileNetV3 + Saliency Head)",
      architecture: "Edge CNN with Spatial Saliency & Evidential Uncertainty Head",
      input: "Single-field 45° non-mydriatic color fundus photograph (512×512 RGB)",
      output: "ICDR 5-class probability vector, Grad-CAM attention heatmap, lesion ROI masks",
      trainingData: "Kaggle EyePACS (88,702 images) + Messidor-2 (1,748 images) calibrated for Indian cameras",
      validationStatus: "Prototype validation value only. Multi-center rural hospital cohort verification in progress."
    },
    auditTimeline: [
      { time: "11:35:10 AM", action: "Fundus image captured", actor: "Sister Rekha M. (Auxiliary Nurse)", note: "Defocus detected" },
      { time: "11:35:25 AM", action: "Quality check triggered", actor: "AutoQuality Engine", note: "Score: 38/100 (Ungradable)" },
      { time: "11:35:26 AM", action: "Inference interlock engaged", actor: "Safety Interlock", note: "Diagnostic prediction suppressed" },
      { time: "11:36:00 AM", action: "Recapture protocol presented to operator", actor: "Guidance System", note: "Tropicamide advised" }
    ],
    doctorReview: {
      decision: "Mark for Review",
      finalDrLevel: null,
      urgency: "Immediate Recapture on Site",
      overrideReason: "Image quality",
      doctorNotes: "Image ungradable due to patient movement and small pupil. Operator instructed to instill 0.5% Tropicamide for pupillary dilation and re-shoot within 20 minutes.",
      reviewerName: "Dr. Rajesh Sharma, MD (Ophthalmology)",
      registrationNumber: "MCI-48920-MH",
      reviewTimestamp: "14-Sep-2026 11:38 AM IST",
      status: "DRAFT"
    }
  }
};

export const ICDR_LEVELS = [
  {
    level: 0,
    title: "Level 0",
    name: "No DR",
    color: "emerald",
    bgClass: "bg-emerald-600",
    textClass: "text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    clinicalDescription: "No apparent diabetic microvascular abnormalities or hemorrhages.",
    referral: "Non-Referable",
    followUp: "Rescreen in 12 months"
  },
  {
    level: 1,
    title: "Level 1",
    name: "Mild NPDR",
    color: "blue",
    bgClass: "bg-blue-600",
    textClass: "text-blue-700",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-300",
    clinicalDescription: "Microaneurysms only (isolated focal capillary saccular outpouches).",
    referral: "Non-Referable (Borderline)",
    followUp: "Review in 6-12 months"
  },
  {
    level: 2,
    title: "Level 2",
    name: "Moderate NPDR",
    color: "amber",
    bgClass: "bg-amber-600",
    textClass: "text-amber-800",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    clinicalDescription: "More than microaneurysms, but less than Severe NPDR (exudates, dot hemorrhages).",
    referral: "Referable",
    followUp: "Ophthalmic referral in 3-4 weeks"
  },
  {
    level: 3,
    title: "Level 3",
    name: "Severe NPDR",
    color: "rose",
    bgClass: "bg-rose-600",
    textClass: "text-rose-800",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
    clinicalDescription: "Rule of 4:2:1 (≥20 intraretinal hemorrhages in 4 quadrants, venous beading in 2, or IRMA in 1).",
    referral: "Referable (Urgent)",
    followUp: "Specialist evaluation within 1-2 weeks"
  },
  {
    level: 4,
    title: "Level 4",
    name: "Proliferative DR (PDR)",
    color: "red",
    bgClass: "bg-red-700",
    textClass: "text-red-900",
    badgeClass: "bg-red-50 text-red-900 border-red-300",
    clinicalDescription: "Neovascularization (NVD/NVE), preretinal/vitreous hemorrhage, or fibrovascular proliferation.",
    referral: "Referable (Emergency)",
    followUp: "Urgent laser photocoagulation / Anti-VEGF"
  }
];

export const UNCERTAINTY_TIERS = {
  TIER_1: {
    name: "Tier 1: Confident Normal",
    description: "Model shows high confidence (≥90%) in Level 0. Minimal clinician friction.",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-500",
    actionNote: "Low risk of diabetic pathology. Routine annual screening interval."
  },
  TIER_2: {
    name: "Tier 2: Uncertain / Priority Review",
    description: "Entropy / uncertainty above threshold (e.g. subtle lesions, border between L1/L2, or marginal image quality). Mandatory physician sign-off.",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    dotClass: "bg-amber-500",
    actionNote: "Automated clearance prohibited. Mandatory ophthalmologist manual verification."
  },
  TIER_3: {
    name: "Tier 3: Confident Referable",
    description: "Strong conviction (≥80%) for DR Level ≥ 2. Fast-tracked tele-ophthalmology referral queue.",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
    dotClass: "bg-rose-600",
    actionNote: "Referral-grade pathology detected with high statistical certainty."
  }
};
