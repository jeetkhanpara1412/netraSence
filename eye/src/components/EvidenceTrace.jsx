import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Microscope, Layers, AlertCircle } from "lucide-react";

export default function EvidenceTrace({
  qualityScore = null,
  detectedLesions = [],
  aiLevel = null,
  severityLabel = "Not assessed",
  uncertaintyTier = "Not assessed",
  doctorStatus = "Pending review",
  onSelectStep
}) {
  const steps = [
    { label: "Image", detail: "Uploaded image", status: "Provided" },
    { label: "Quality", detail: Number.isFinite(qualityScore) ? `${qualityScore}% quality score` : "Not assessed", status: "Informational" },
    { label: "Lesions", detail: detectedLesions.length ? detectedLesions.join(", ") : "Not assessed", status: "Requires validation" },
    { label: "Model output", detail: aiLevel == null ? "Not assessed" : `Level ${aiLevel} (${severityLabel})`, status: "Uncalibrated" },
    { label: "Uncertainty", detail: uncertaintyTier || "Not assessed", status: "Not clinically validated" },
    { label: "Clinician review", detail: doctorStatus, status: "Not authenticated" }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
          Screening workflow trace
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          Workflow metadata only
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 mt-2">
        {steps.map((st, i) => (
          <div
            key={i}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="font-bold text-slate-700">{st.label}</span>
                <span className="font-mono">0{i + 1}</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-900 leading-tight truncate" title={st.detail}>
                {st.detail}
              </div>
            </div>
            <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center gap-1 text-[10px] text-teal-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-teal-600" />
              <span>{st.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
