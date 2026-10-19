import React from "react";
import { User, Calendar, Camera, Hash, AlertCircle, Eye } from "lucide-react";

export default function CaseHeader({ patient, caseId, caseType = "DEMO_CASE" }) {
  if (!patient) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Patient Primary Demographics */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-2">
                <span>{patient.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-700 border border-slate-300">
                  {patient.id}
                </span>
                {caseType === "DEMO_CASE" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                    Demo Case
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{patient.age ? `${patient.age} Yrs` : "Age not provided"} • {patient.gender || "Gender not provided"}</span>
                <span>•</span>
                <span className="text-teal-800 font-medium">{patient.diabetesDuration}</span>
                <span>•</span>
                <span>HbA1c: <strong>{patient.hba1c}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right: Optical Hardware, Examination Timestamp, Eye Indicator & Case ID */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Eye className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-semibold text-slate-800">
              Exam Eye: {patient.eye || "Eye not provided"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 hidden md:flex">
            <Camera className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[200px]" title={patient.cameraModel}>
              {patient.cameraModel || "Camera not provided"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{patient.examDate}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-slate-700">
            <Hash className="w-3 h-3 text-slate-400" />
            <span>{caseId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
