import React from "react";
import { AlertTriangle, CheckCircle2, ArrowRight, Eye, Focus, Sun, Sparkles } from "lucide-react";

export default function CaptureGuidance({ guidance = [], isUngradable = false, onRecaptureAction }) {
  if (!guidance || guidance.length === 0) return null;

  return (
    <div className={`p-3.5 rounded-xl border mb-3 ${
      isUngradable
        ? "bg-rose-50/70 border-rose-300 text-rose-950"
        : "bg-amber-50/70 border-amber-300 text-amber-950"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className={`w-4 h-4 shrink-0 ${isUngradable ? "text-rose-600" : "text-amber-600"}`} />
        <div className="font-bold text-xs">
          {isUngradable ? "Actionable Recapture Protocol (PHC Operator Checklist)" : "Image Quality Optimization Suggestions"}
        </div>
      </div>

      <ul className="space-y-1.5 text-xs">
        {guidance.map((step, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
              isUngradable ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"
            }`}>
              {idx + 1}
            </span>
            <span className="leading-snug">{step}</span>
          </li>
        ))}
      </ul>

      {onRecaptureAction && (
        <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center justify-between">
          <span className="text-[11px] text-rose-800 font-medium">
            Standard Operating Procedure: Retake within 15 minutes before patient departure.
          </span>
          <button
            type="button"
            onClick={onRecaptureAction}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-md text-xs font-bold transition-colors shadow-2xs"
          >
            Initiate Retake Session
          </button>
        </div>
      )}
    </div>
  );
}
