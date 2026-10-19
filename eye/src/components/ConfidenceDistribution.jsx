import React from "react";
import { BarChart3, Info } from "lucide-react";
import { ICDR_LEVELS } from "../data/mockScreening.js";

export default function ConfidenceDistribution({
  probabilities = [],
  modelAlternatives = null,
  isUngradable = false
}) {
  const hasProbabilities = Array.isArray(probabilities)
    && probabilities.length === 5
    && probabilities.every((item) => Number.isFinite(item.probability));
  const probabilityTotal = hasProbabilities
    ? probabilities.reduce((total, item) => total + item.probability, 0)
    : null;

  if (isUngradable) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-xs text-slate-700">ICDR Multi-Class Distribution</span>
          </div>
          <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Suppressed
          </span>
        </div>
        <p className="text-xs text-slate-500 italic py-2">
          Probability generation suppressed due to ungradable optical quality.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
            Uncalibrated Model Score Distribution
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {probabilityTotal == null ? "Not assessed" : `Σ scores = ${probabilityTotal.toFixed(1)}%`}
        </span>
      </div>

      {!hasProbabilities ? (
        <p className="text-xs text-slate-500 italic py-2">A five-class model score distribution is not available.</p>
      ) : (
      <div className="space-y-2">
        {ICDR_LEVELS.map((icdr) => {
          const probItem = probabilities.find((p) => p.level === icdr.level);
          const probValue = probItem ? probItem.probability : 0;
          const isHighest = probValue >= 50;

          return (
            <div key={icdr.level} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${icdr.bgClass}`} />
                  <span>{icdr.title}: {icdr.name}</span>
                </span>
                <span className={`font-mono text-xs ${isHighest ? "font-bold text-teal-800" : "text-slate-500"}`}>
                  {probValue.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHighest ? icdr.bgClass : "bg-slate-300"
                  }`}
                  style={{ width: `${Math.min(probValue, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Model Alternatives & Neighboring-Grade Context */}
      {modelAlternatives && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
            <span>Model Ranking & Transition Uncertainty:</span>
            {modelAlternatives.uncertaintyContext && (
              <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {modelAlternatives.uncertaintyContext}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="p-1.5 bg-teal-50 rounded border border-teal-200">
              <div className="text-[10px] text-teal-700 font-semibold">1st (Top)</div>
              <div className="font-bold text-teal-950 truncate">{modelAlternatives.top?.label}</div>
              <div className="font-mono text-teal-800 font-bold">{modelAlternatives.top?.probability}%</div>
            </div>
            <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold">2nd Pick</div>
              <div className="font-medium text-slate-800 truncate">{modelAlternatives.second?.label}</div>
              <div className="font-mono text-slate-600">{modelAlternatives.second?.probability}%</div>
            </div>
            <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
              <div className="text-[10px] text-slate-500 font-semibold">3rd Pick</div>
              <div className="font-medium text-slate-800 truncate">{modelAlternatives.third?.label}</div>
              <div className="font-mono text-slate-600">{modelAlternatives.third?.probability}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Statistical Disclaimer */}
      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Not calibrated:</strong> These are raw softmax scores, not calibrated probabilities or clinical certainty. A qualified clinician must review the source image.
        </span>
      </div>
    </div>
  );
}
