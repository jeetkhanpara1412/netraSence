import React from "react";
import { Eye, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";

export default function EyeSelector({ bilateral, activeEye, onSelectEye, onTriggerLeftEye }) {
  if (!bilateral) {
    return (
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-medium">
        <button
          type="button"
          onClick={() => onSelectEye("OD")}
          className={`flex-1 py-1 px-2.5 rounded-md text-center transition-all ${
            activeEye === "OD"
              ? "bg-teal-700 text-white shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Right Eye (OD)
        </button>
        <button
          type="button"
          onClick={() => onSelectEye("OS")}
          className={`flex-1 py-1 px-2.5 rounded-md text-center transition-all ${
            activeEye === "OS"
              ? "bg-teal-700 text-white shadow-2xs font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Left Eye (OS)
        </button>
      </div>
    );
  }

  const od = bilateral.od;
  const os = bilateral.os;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Eye className="w-3.5 h-3.5 text-teal-700" />
          <span>Bilateral Screening (OD / OS)</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Two-Eye Protocol
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Right Eye - OD */}
        <button
          type="button"
          onClick={() => onSelectEye("OD")}
          className={`text-left p-2.5 rounded-lg border transition-all relative ${
            activeEye === "OD"
              ? "bg-teal-50/60 border-teal-500 ring-1 ring-teal-500/30"
              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-slate-950">
              Right Eye (OD)
            </span>
            {od?.status === "Analyzed" ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Analyzed
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded">
                Pending
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600">
            {od?.status === "Analyzed" ? (
              <span className="font-medium text-slate-800">
                {od.severity} {od.qualityScore ? `• Q: ${od.qualityScore}%` : ""}
              </span>
            ) : (
              <span className="text-slate-500 italic">No image captured</span>
            )}
          </div>
        </button>

        {/* Left Eye - OS */}
        <button
          type="button"
          onClick={() => onSelectEye("OS")}
          className={`text-left p-2.5 rounded-lg border transition-all relative ${
            activeEye === "OS"
              ? "bg-teal-50/60 border-teal-500 ring-1 ring-teal-500/30"
              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs text-slate-950">
              Left Eye (OS)
            </span>
            {os?.status === "Analyzed" ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Analyzed
              </span>
            ) : os?.status === "Ungradable" ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-300">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Ungradable
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded">
                <Clock className="w-3 h-3 text-slate-400" /> Not Uploaded
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600">
            {os?.status === "Analyzed" ? (
              <span className="font-medium text-slate-800">{os.severity}</span>
            ) : os?.status === "Ungradable" ? (
              <span className="text-rose-700 font-medium">Recapture required</span>
            ) : (
              <span className="text-teal-700 font-medium flex items-center gap-0.5 hover:underline">
                Capture Left Eye <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
