import React from "react";
import { History, Calendar, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PreviousScreening({ previousScreening, currentDrLevel }) {
  if (!previousScreening || !previousScreening.hasPrevious) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center gap-1.5 mb-1.5">
          <History className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-xs text-slate-700">Longitudinal History</span>
        </div>
        <p className="text-xs text-slate-500 italic">
          No previous screening record was provided; no baseline or progression comparison is available.
        </p>
      </div>
    );
  }

  const previousDrLevel = previousScreening.drLevel;
  const canCompare = Number.isInteger(currentDrLevel) && Number.isInteger(previousDrLevel);
  const isProgression = canCompare && currentDrLevel > previousDrLevel;
  const isStable = canCompare && currentDrLevel === previousDrLevel;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
            Longitudinal Screening Comparison
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Supplied history
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
        {/* Previous Exam Box */}
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Previous Screening</span>
          </div>
          <div className="font-bold text-slate-800 mt-0.5">
            {previousScreening.severityLabel || "Not assessed"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {previousScreening.examDate || "Date not provided"}
          </div>
        </div>

        {/* Current Exam Box */}
        <div className={`p-2 rounded-lg border ${
          isProgression ? "bg-amber-50/70 border-amber-300" : isStable ? "bg-emerald-50/70 border-emerald-300" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-between">
            <span>Current Screening</span>
            {isProgression ? (
              <span className="text-amber-700 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Progression
              </span>
            ) : isStable ? (
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Stable
              </span>
            ) : (
              <span className="text-slate-600 font-medium">Comparison unavailable</span>
            )}
          </div>
          <div className="font-bold text-slate-900 mt-0.5">
            {currentDrLevel == null ? "Not assessed" : `Level ${currentDrLevel}`}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">
            {previousScreening.currentExamDate || "Date not provided"}
          </div>
        </div>
      </div>

      {/* Trajectory comparison note without unsubstantiated claims */}
      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
        <div className="font-semibold text-slate-800 text-[11px] mb-0.5">Clinical Progression Note:</div>
        <p className="text-[11px]">{previousScreening.comparisonNote || "No comparison note was provided."}</p>
      </div>
    </div>
  );
}
