import React from "react";
import { Check, AlertTriangle, XCircle, ShieldCheck, Eye, Activity, GitCommit } from "lucide-react";

export default function LesionAnalysis({ lesions, structures, isUngradable = false }) {
  if (!lesions) return null;

  const lesionTypes = [
    {
      key: "microaneurysms",
      title: "Microaneurysms (MAs)",
      badge: "Early Hallmark",
      data: lesions.microaneurysms
    },
    {
      key: "hemorrhages",
      title: "Intraretinal Hemorrhages",
      badge: "Dot & Blot",
      data: lesions.hemorrhages
    },
    {
      key: "exudates",
      title: "Exudates (Hard / Soft)",
      badge: "Lipid Leakage / CWS",
      data: lesions.exudates
    },
    {
      key: "neovascularization",
      title: "Neovascularization (NV)",
      badge: "Proliferative Hallmark",
      data: lesions.neovascularization
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
      {/* Lesion Section */}
      <div className="border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Retinal Microvascular Lesion Mapping
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Pathological Lesion Categorization
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {lesionTypes.map(({ key, title, badge, data }) => {
            if (!data) return null;
            const detected = data.detected;
            const isNegative = detected === false;
            const isUnknown = detected === null || isUngradable;

            let cardBg = "bg-slate-50 border-slate-200";
            let statusText = "text-slate-700";

            if (detected === true) {
              cardBg = key === "neovascularization"
                ? "bg-red-50/80 border-red-300"
                : "bg-amber-50/70 border-amber-300";
              statusText = key === "neovascularization" ? "text-red-900" : "text-amber-900";
            } else if (isNegative) {
              cardBg = "bg-emerald-50/50 border-emerald-200";
              statusText = "text-emerald-900";
            }

            return (
              <div key={key} className={`p-3 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {title}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isUnknown
                      ? "bg-slate-200 text-slate-700"
                      : detected
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {isUnknown ? "Indeterminate" : detected ? "Detected" : "Absent"}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 mb-0.5">
                  {data.count}
                </div>
                <div className="text-[11px] text-slate-500 mb-1">
                  Severity: <strong className={statusText}>{data.severity}</strong>
                </div>

                {data.regions && data.regions.length > 0 && (
                  <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-200/60">
                    Loc: {data.regions.join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Retinal Anatomical Structures (Optic Disc, Macula, Vessels) */}
      {structures && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Key Anatomical Landmark Validation:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Optic Disc */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">Optic Disc (Nasal Pole)</span>
                {structures.opticDisc.cupDiscRatio && (
                  <span className="font-mono text-[11px] text-slate-500">C:D {structures.opticDisc.cupDiscRatio}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {structures.opticDisc.status}
              </p>
            </div>

            {/* Macula / Fovea */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">Macula & Fovea</span>
                {structures.maculaFovea.dmeSuspected && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    DME Risk
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {structures.maculaFovea.status}
              </p>
            </div>

            {/* Retinal Vessels */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">Vascular Arcades</span>
                <span className="text-[10px] text-slate-500 font-mono">Caliber</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {structures.vessels.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
