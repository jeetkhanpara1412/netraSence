import React from "react";
import { Sparkles, Eye, Info, Crosshair, AlertTriangle } from "lucide-react";

export default function ExplainabilityViewer({ explainability, isUngradable = false }) {
  if (!explainability) return null;

  const { heatmapDescription, attentionHotspots = [] } = explainability;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            XAI
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Explainable AI (XAI) — Saliency Attribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Gradient-Weighted Class Activation Mapping (Grad-CAM) Interpretation
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
          Feature Importance
        </span>
      </div>

      {isUngradable ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Grad-CAM feature attribution disabled for ungradable images to prevent false activations.</span>
        </div>
      ) : (
        <>
          {/* Summary Narrative */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-700 mb-3 leading-relaxed">
            <strong className="text-slate-900 block mb-1 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Saliency Activation Pattern:
            </strong>
            {heatmapDescription}
          </div>

          {/* Hotspots Breakdown */}
          {attentionHotspots.length > 0 ? (
            <div>
              <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Convolutional Attention Hotspots:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {attentionHotspots.map((spot, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        Hotspot #{idx + 1}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                        {(spot.intensity * 100).toFixed(0)}% Saliency
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {spot.feature}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Retinal Coord: ({spot.x}%, {spot.y}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg">
              No elevated pathological attention hotspots identified. Normal retinal vascular pattern.
            </div>
          )}

          {/* Required Clinical Caution Banner */}
          <div className="mt-2.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong>Clinical Notice:</strong> AI attention visualization — not independent diagnostic evidence. Correlate with clinical ophthalmoscopy.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
