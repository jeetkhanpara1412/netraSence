import React, { useState } from "react";
import { HelpCircle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function UncertaintyPanel({
  uncertaintyTier = "Uncalibrated; clinician review required",
  uncertaintyScore,
  isUngradable = false
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
            Model score limitations
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-0.5"
          title="Explain model score limitations"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Why?</span>
          {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 flex items-center justify-between gap-2">
        <span className="font-bold text-xs">{uncertaintyTier}</span>
        <span className="font-mono text-[11px] font-semibold text-slate-700">
          Normalized entropy: {isUngradable ? "Not assessed" : Number.isFinite(uncertaintyScore) ? uncertaintyScore.toFixed(3) : "Not assessed"}
        </span>
      </div>

      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        {isUngradable
          ? "Image quality did not pass the analysis gate. No disease classification was produced."
          : "Model scores and entropy are uncalibrated. A qualified clinician must review the source image; do not use these outputs alone to determine or defer care."}
      </p>

      {showExplanation && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-2 text-slate-700 bg-slate-50 p-3 rounded-lg">
          <div className="font-bold text-slate-900 text-xs">What the displayed entropy means</div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            It is normalized Shannon entropy calculated from the model&apos;s five-class softmax distribution. It has not been calibrated or clinically validated, and it is not a measure of diagnostic certainty.
          </p>
        </div>
      )}
    </div>
  );
}
