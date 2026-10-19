import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Activity, ChevronDown, ChevronUp } from "lucide-react";

export default function SelfValidation({
  selfValidation,
  isUngradable = false
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!selfValidation) return null;

  const hasAlignmentScore = Number.isFinite(selfValidation.alignmentScore);
  const isConsistent = selfValidation.isConsistent;

  return (
    <div className={`border rounded-xl p-3.5 shadow-2xs ${
      isUngradable
        ? "bg-slate-50 border-slate-200"
        : !hasAlignmentScore
        ? "bg-slate-50 border-slate-200"
        : hasAlignmentScore && isConsistent
        ? "bg-emerald-50/50 border-emerald-300"
        : "bg-rose-50/60 border-rose-300"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${
            isUngradable
              ? "bg-slate-200 text-slate-600"
              : !hasAlignmentScore
              ? "bg-slate-200 text-slate-600"
              : hasAlignmentScore && isConsistent
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}>
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Explainability status</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {hasAlignmentScore
                ? "An alignment value was provided; its method and clinical relevance are not established here."
                : "No validated lesion-alignment result is available."}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-500 hover:text-slate-800 p-1"
          title="Toggle alignment breakdown"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Metrics Pill Row */}
      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center text-xs">
        {/* Alignment Status */}
        <div className="bg-white p-2 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium">Status</div>
          <div className="font-bold flex items-center justify-center gap-1 mt-0.5 text-slate-900">
            {hasAlignmentScore && isConsistent ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Consistent</span>
              </>
            ) : isUngradable ? (
              <span className="text-slate-500">Suppressed</span>
            ) : !hasAlignmentScore ? (
              <span className="text-slate-500">Not assessed</span>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-700">Mismatch</span>
              </>
            )}
          </div>
        </div>

        {/* Spatial Overlap Score */}
        <div className="bg-white p-2 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium">Evidence Alignment</div>
          <div className="font-mono font-bold text-slate-900 mt-0.5">
            {isUngradable ? "Suppressed" : hasAlignmentScore ? `${selfValidation.alignmentScore}%` : "Not assessed"}
          </div>
        </div>

        {/* Level Correlation */}
        <div className="bg-white p-2 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium">Grad-CAM ↔ Lesions</div>
          <div className="font-semibold text-teal-800 mt-0.5">
            {selfValidation.gradcamLesionAlignment || "Not assessed"}
          </div>
        </div>
      </div>

      {/* Summary statement */}
      <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
        {selfValidation.summary}
      </p>

      {/* Expanded technical details */}
      {showDetails && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 space-y-1 bg-white/70 p-2.5 rounded-lg">
          <div className="font-bold text-slate-800">Available details:</div>
          <p>{selfValidation.details}</p>
          <div className="text-slate-500 italic mt-1">
            "Grad-CAM is a model-attention visualization and does not independently confirm a lesion or diagnosis."
          </div>
        </div>
      )}
    </div>
  );
}
