import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, Cpu } from "lucide-react";

export default function TrustPanel({
  reviewPriority,
  aiLimitations = [],
  modelCard = null
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
            Clinical Trust & Safety Framework
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-0.5"
        >
          <span>{isOpen ? "Collapse" : "Expand Specs"}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Review Priority - Why Should I Review This? */}
      {reviewPriority && (
        <div className="mb-3 p-2.5 rounded-lg bg-teal-50/60 border border-teal-200">
          <div className="text-[11px] font-bold text-teal-950 flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
            <span>Review Priority Trigger: {reviewPriority.tier}</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-700">
            {reviewPriority.reasons?.map((r, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-teal-600 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What the AI Does Not Know - Safety Boundaries */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Clinical Safety Boundary (Model Limitations)</span>
        </div>
        <ul className="space-y-1 text-[11px] text-slate-600">
          {aiLimitations.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-slate-400 font-bold">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Model Card Snapshot */}
      {isOpen && modelCard && (
        <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1.5 bg-slate-900 text-slate-200 p-3 rounded-lg font-mono">
          <div className="flex items-center gap-1.5 text-teal-400 font-sans font-bold text-xs mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Edge Model Card Snapshot (SIH Prototype)</span>
          </div>
          <div className="text-[10px] space-y-1 text-slate-300">
            <div><strong className="text-white">Architecture:</strong> {modelCard.architecture}</div>
            <div><strong className="text-white">Training Corpora:</strong> {modelCard.trainingData}</div>
            <div><strong className="text-white">Input Tensor:</strong> {modelCard.input}</div>
            <div><strong className="text-white">Output Tensor:</strong> {modelCard.output}</div>
            <div className="text-slate-400 italic pt-1">{modelCard.validationStatus}</div>
          </div>
        </div>
      )}
    </div>
  );
}
