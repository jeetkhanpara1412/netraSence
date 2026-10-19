import React from "react";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, RefreshCw, Focus, Sun, Maximize, Contrast } from "lucide-react";

export default function ImageQualityCard({ quality, onRecaptureRequest }) {
  if (!quality) return null;

  const { overallScore, status, isGradable, metrics, recaptureNeeded, recaptureGuidance } = quality;

  const getStatusBadge = () => {
    switch (status) {
      case "Good":
        return {
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: CheckCircle,
          label: "Gradable Quality (Good)"
        };
      case "Borderline":
        return {
          bg: "bg-amber-100 text-amber-800 border-amber-300",
          icon: AlertTriangle,
          label: "Borderline Quality (Review Required)"
        };
      case "Ungradable":
      default:
        return {
          bg: "bg-rose-100 text-rose-800 border-rose-300",
          icon: XCircle,
          label: "Ungradable (Recapture Mandatory)"
        };
    }
  };

  const badge = getStatusBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
            IQ
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Image Quality Assessment</h3>
            <p className="text-[11px] text-slate-500">
              Automated Optical & Artifact Quality Index
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Quality Score</span>
            <div className="text-base font-extrabold font-mono text-slate-900 leading-tight">
              {overallScore}%
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${badge.bg}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            {status}
          </span>
        </div>
      </div>

      {/* 4 Optical Diagnostic Criteria */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Focus */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Focus className="w-3.5 h-3.5 text-teal-600" />
              Focus
            </span>
            <span className="font-mono font-bold text-slate-800">{metrics.focus.score}%</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
            {metrics.focus.description}
          </p>
        </div>

        {/* Illumination */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Sun className="w-3.5 h-3.5 text-teal-600" />
              Illumination
            </span>
            <span className="font-mono font-bold text-slate-800">{metrics.illumination.score}%</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
            {metrics.illumination.description}
          </p>
        </div>

        {/* Field of View */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Maximize className="w-3.5 h-3.5 text-teal-600" />
              Field-of-View
            </span>
            <span className="font-mono font-bold text-slate-800">{metrics.fieldOfView.score}%</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
            {metrics.fieldOfView.description}
          </p>
        </div>

        {/* Contrast */}
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Contrast className="w-3.5 h-3.5 text-teal-600" />
              Contrast
            </span>
            <span className="font-mono font-bold text-slate-800">{metrics.contrast.score}%</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
            {metrics.contrast.description}
          </p>
        </div>
      </div>

      {/* Recapture Guidance Alert (When poor quality detected) */}
      {recaptureNeeded && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-bold mb-1.5 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>CLINICAL RECAPTURE PROTOCOL FOR HEALTH WORKER:</span>
          </div>
          <ul className="space-y-1 text-[11px] text-rose-800 list-disc list-inside mb-2">
            {recaptureGuidance.map((guide, idx) => (
              <li key={idx} className="leading-snug">
                {guide}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-1 border-t border-rose-200/70">
            <span className="text-[11px] font-medium text-rose-700">
              *AI screening model is automatically paused to prevent diagnostic false reassurance.
            </span>
            {onRecaptureRequest && (
              <button
                type="button"
                onClick={onRecaptureRequest}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
              >
                <RefreshCw className="w-3 h-3" />
                Initiate Recapture
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
