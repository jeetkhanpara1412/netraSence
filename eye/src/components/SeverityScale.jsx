import React from "react";
import { ICDR_LEVELS } from "../data/mockScreening.js";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function SeverityScale({ currentLevel = 2, doctorLevel = null, isUngradable = false }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          ICDR International Clinical Diabetic Retinopathy Scale (0–4)
        </h3>
        <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          Referral Threshold: Level ≥ 2
        </span>
      </div>

      {/* Progress / Step Scale */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {ICDR_LEVELS.map((item) => {
          const isAiSelected = !isUngradable && currentLevel === item.level;
          const isDoctorSelected = !isUngradable && doctorLevel === item.level;

          return (
            <div
              key={item.level}
              className={`p-2 rounded-lg border text-center relative transition-all ${
                isAiSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-teal-500/50"
                  : isDoctorSelected
                  ? "bg-teal-50 border-teal-500 text-teal-950 ring-1 ring-teal-400"
                  : "bg-slate-50 border-slate-200/80 text-slate-700"
              }`}
            >
              {/* Level indicator */}
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isAiSelected ? "bg-white text-slate-900" : "bg-slate-200 text-slate-800"
                }`}>
                  L{item.level}
                </span>
              </div>

              <div className={`text-xs font-bold truncate ${isAiSelected ? "text-white" : "text-slate-900"}`}>
                {item.name}
              </div>

              <div className={`text-[10px] mt-0.5 truncate ${
                isAiSelected ? "text-slate-300" : "text-slate-500"
              }`}>
                {item.referral}
              </div>

              {/* Badges for AI vs Doctor decision */}
              <div className="mt-1 flex flex-col gap-0.5 items-center">
                {isAiSelected && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500 text-slate-950 uppercase tracking-tight">
                    AI Detected
                  </span>
                )}
                {isDoctorSelected && !isAiSelected && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 uppercase tracking-tight">
                    Doctor Modified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical Reference Subtext */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <span>Non-Referable (L0-L1): Community PHC Routine Observation</span>
        <span className="font-semibold text-rose-700">Referable (L2-L4): Tele-Ophthalmology Hospital Consult</span>
      </div>
    </div>
  );
}
