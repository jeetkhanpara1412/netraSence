import React from "react";
import { User, Calendar, Eye, Activity, MapPin, Camera } from "lucide-react";

export default function PatientInfo({ patient, onEyeChange, isAnalyzing }) {
  if (!patient) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs mb-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
        {/* Patient Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-xs shrink-0">
            {patient.name?.charAt(0) || "P"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {patient.name}
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
                {patient.id}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>{patient.age ? `${patient.age}Y` : "Age not provided"}/{patient.gender || "Gender not provided"}</span>
              <span>•</span>
              <span className="text-slate-600 font-medium">{patient.diabetesDuration}</span>
              <span>•</span>
              <span className="text-rose-700 font-medium">HbA1c: {patient.hba1c}</span>
              <span>•</span>
              <span>BP: {patient.systemicBp}</span>
            </div>
          </div>
        </div>

        {/* Eye Selection OD (Right) / OS (Left) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Eye:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onEyeChange && onEyeChange("OD (Right Eye)")}
              disabled={isAnalyzing}
              className={`px-2.5 py-0.5 rounded-md transition-all text-xs ${
                patient.eye?.includes("OD") || patient.eye?.includes("Right")
                  ? "bg-teal-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              OD (Right)
            </button>
            <button
              type="button"
              onClick={() => onEyeChange && onEyeChange("OS (Left Eye)")}
              disabled={isAnalyzing}
              className={`px-2.5 py-0.5 rounded-md transition-all text-xs ${
                patient.eye?.includes("OS") || patient.eye?.includes("Left")
                  ? "bg-teal-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              OS (Left)
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Examination & Hardware Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3 gap-1.5 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 truncate">
          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700">PHC:</strong> {patient.phcCenter}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 truncate">
          <Camera className="w-3 h-3 text-teal-600 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700">Cam:</strong> {patient.cameraModel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 truncate">
          <Calendar className="w-3 h-3 text-teal-600 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700">Date:</strong> {patient.examDate}
          </span>
        </div>
      </div>
    </div>
  );
}
