import React from "react";
import { Eye, X, ZoomIn, ZoomOut, RotateCcw, Sliders, ShieldCheck } from "lucide-react";

export default function FocusMode({
  isOpen,
  onClose,
  images,
  aiResult,
  patient,
  children
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-3 sm:p-6 no-print overflow-hidden animate-in fade-in duration-200">
      {/* Top Clinical Focus Mode Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 mb-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>Clinical Focus Mode: {patient?.name} ({patient?.eye})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-900 text-teal-300 font-mono">
                High-Resolution Diagnostic Canvas
              </span>
            </div>
            <div className="text-xs text-slate-400">
              AI Stage: <strong>{aiResult?.severityLabel}</strong> • Uncalibrated score: {aiResult?.confidence}%
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Exit Focus Mode</span>
        </button>
      </div>

      {/* Main Focus Area */}
      <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
