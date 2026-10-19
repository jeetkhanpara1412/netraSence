import React from "react";
import { Eye, Layers, Circle, CheckSquare, Square } from "lucide-react";

export default function StructureLayers({
  activeLayers = {
    vessels: true,
    opticDisc: true,
    fovea: true,
    lesions: true
  },
  onToggleLayer,
  structures = null
}) {
  const layerOptions = [
    { key: "vessels", label: "Retinal Vessels", color: "text-rose-600", note: structures?.vessels?.status || "Not assessed" },
    { key: "opticDisc", label: "Optic Disc (OD)", color: "text-amber-500", note: structures?.opticDisc?.status || "Not assessed" },
    { key: "fovea", label: "Fovea / Macula", color: "text-yellow-600", note: structures?.maculaFovea?.status || "Not assessed" },
    { key: "lesions", label: "Microvascular Lesions", color: "text-red-600", note: "MA, HE, Hard Exudates" }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
            Anatomical Structure Layers
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          Overlay Toggles
        </span>
      </div>

      <div className="space-y-2">
        {layerOptions.map((layer) => {
          const isEnabled = activeLayers[layer.key];
          return (
            <button
              key={layer.key}
              type="button"
              onClick={() => onToggleLayer(layer.key)}
              className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between text-xs ${
                isEnabled
                  ? "bg-teal-50/50 border-teal-300 text-slate-900"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-900 leading-tight">
                    {layer.label}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                    {layer.note}
                  </div>
                </div>
              </div>
              <span className={`w-2 h-2 rounded-full ${isEnabled ? "bg-teal-600" : "bg-slate-300"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
