import React, { useState } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Layers,
  Eye,
  FileText
} from "lucide-react";

export const WALKTHROUGH_STEPS = [
  {
    step: 1,
    title: "1. Clinical Fundus Image Acquisition",
    category: "Optics & Camera",
    summary:
      "Displays uploaded fundus images and provides image inspection controls.",
    rationale:
      "Capture device, field of view, and acquisition settings are shown only when provided; viewing controls do not establish image calibration.",
    badge: "Image Review"
  },
  {
    step: 2,
    title: "2. Automated Optical Quality Assessment",
    category: "Safety Interlock",
    summary:
      "Runs the configured image-quality checks before permitting automated grading.",
    rationale:
      "An image marked ungradable does not receive an automated grade. Quality checks are not a substitute for clinical image review.",
    badge: "Quality Checks"
  },
  {
    step: 3,
    title: "3. ICDR DR Staging Result",
    category: "Diagnostic Classification",
    summary:
      "A five-class ICDR classification is returned only when a trained checkpoint is available and the image is gradable.",
    rationale:
      "This workspace currently has no trained checkpoint; demo presets show static illustrative values and are not model predictions.",
    badge: "Checkpoint Required"
  },
  {
    step: 4,
    title: "4. Lesion Findings",
    category: "Pathological Attribution",
    summary:
      "Automated lesion segmentation and counts are not implemented; findings are reported as not assessed.",
    rationale:
      "Generated attention visualizations must not be interpreted as lesion masks or independent diagnostic evidence.",
    badge: "Not Implemented"
  },
  {
    step: 5,
    title: "5. Grad-CAM Neural Attention Saliency",
    category: "Neural Interpretability",
    summary:
      "Computes gradient-weighted class activation mapping (Grad-CAM) to highlight which retinal regions drove the CNN's feature representation.",
    rationale:
      "A heatmap is an attention visualization only. It does not prove that a lesion is present or that the model relied on a clinically relevant feature.",
    badge: "Attention Visualization"
  },
  {
    step: 6,
    title: "6. Evidential Uncertainty & Triage Tiers",
    category: "Risk Stratification",
    summary:
      "Displays model probability and entropy-derived uncertainty when an actual prediction is available.",
    rationale:
      "These are model scores, not clinical certainty. Calibration and triage thresholds have not been externally validated.",
    badge: "Uncertainty Scores"
  },
  {
    step: 7,
    title: "7. Prediction Self-Validation",
    category: "Not Implemented",
    summary:
      "No validated self-validation or attention-to-lesion comparison is implemented.",
    rationale:
      "No lesion-alignment score or automated evidence-mismatch alert is produced.",
    badge: "Not Implemented"
  },
  {
    step: 8,
    title: "8. Clinician Decision & Override Audit",
    category: "Human-In-The-Loop",
    summary:
      "The interface can record a review decision, grade, urgency, and notes.",
    rationale:
      "Reviewer identity is not authenticated by this application; recorded reviews are not digitally signed or synchronized to an EMR.",
    badge: "Review Recording"
  },
  {
    step: 9,
    title: "9. Screening Report",
    category: "Document & Tele-Referral",
    summary:
      "Generates a printable report from the available screening record.",
    rationale:
      "ABDM integration, SMS/WhatsApp delivery, and validated bilingual patient counseling are not implemented.",
    badge: "Printable Report"
  }
];

export default function DemoWalkthrough({ isOpen, onClose, onNavigateToReport }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const current = WALKTHROUGH_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === WALKTHROUGH_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      if (onNavigateToReport) onNavigateToReport();
    } else {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStepIdx((prev) => prev - 1);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-lg w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-teal-500/40 p-4 sm:p-5 no-print animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>SIH 2026 Judge Demonstration Guide</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono">
                Step {current.step} of 9
              </span>
            </div>
            <div className="text-[11px] text-amber-300/80 font-medium">
              {current.category} • {current.badge}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          title="Close walkthrough guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-sm text-teal-300">
          {current.title}
        </h3>
        <p className="text-xs text-slate-200 leading-relaxed">
          {current.summary}
        </p>
        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 leading-relaxed">
          <strong className="text-amber-300">Clinical UX Rationale:</strong> {current.rationale}
        </div>
      </div>

      {/* Progress Dots & Navigation Controls */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-1">
          {WALKTHROUGH_STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStepIdx(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIdx
                  ? "w-5 bg-teal-400"
                  : idx < currentStepIdx
                  ? "w-2 bg-teal-600/50"
                  : "w-2 bg-slate-700"
              }`}
              title={`Jump to ${s.title}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs text-slate-300 font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1 px-3.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-xs font-bold text-white shadow-xs"
          >
            <span>{isLast ? "View Detailed Report" : "Next Principle"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
