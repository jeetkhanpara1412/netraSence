import React from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export default function Disclaimer({ variant = "standard" }) {
  if (variant === "compact") {
    return (
      <div className="p-2 bg-amber-50/90 border border-amber-300 rounded-lg text-[11px] text-amber-950 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Clinical Safety Notice:</strong> AI-assisted screening decision support system. Not an autonomous diagnostic device. All findings require ophthalmologist confirmation.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
      <div className="flex items-center gap-2 mb-1.5 text-slate-800 font-bold">
        <ShieldAlert className="w-4 h-4 text-teal-700" />
        <span>Medical Device & Clinical Protocol Regulatory Disclaimer</span>
      </div>
      <p className="leading-relaxed">
        RetinaSight AI is an explainable decision-support tool engineered for rural primary health centres, vision centres, and hospital tele-ophthalmology nodes (SIH 2026 Prototype). The algorithm produces screening risk stratifications and interpretable saliency heatmaps to assist qualified eye care professionals. This system does NOT perform autonomous medical diagnosis, surgical prescription, or direct therapeutic intervention. The final diagnostic impression, clinical management, and referral decision remain the sole legal responsibility of the consulting ophthalmologist.
      </p>
    </div>
  );
}
