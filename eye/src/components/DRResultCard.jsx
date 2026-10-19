import React from "react";
import { AlertCircle, CheckCircle, HelpCircle, Shield, ArrowRight, Activity } from "lucide-react";
import { UNCERTAINTY_TIERS } from "../data/mockScreening.js";

export default function DRResultCard({ aiResult, isUngradable = false }) {
  if (!aiResult) return null;

  const {
    drLevel,
    severityLabel,
    icdrCode,
    referableStatus,
    referralUrgency,
    confidence,
    uncertaintyTier,
    recommendation
  } = aiResult;

  const tierLabel = String(uncertaintyTier || "");
  const requiresReview = tierLabel.toLowerCase().includes("uncalibrated");
  const getTierInfo = () => {
    if (requiresReview) {
      return {
        name: "Clinician review required",
        description: "Model scores and entropy are uncalibrated and must not guide care on their own.",
        badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
        dotClass: "bg-slate-500"
      };
    }
    if (tierLabel.includes("Tier 1")) return UNCERTAINTY_TIERS.TIER_1;
    if (tierLabel.includes("Tier 2")) return UNCERTAINTY_TIERS.TIER_2;
    if (tierLabel.includes("Tier 3")) return UNCERTAINTY_TIERS.TIER_3;
    return {
      name: tierLabel || "Not assessed",
      description: "No validated uncertainty classification is available.",
      badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
      dotClass: "bg-slate-500"
    };
  };

  const tier = getTierInfo();

  const getLevelBadgeColor = (lvl) => {
    if (lvl === 0) return "bg-emerald-600 text-white";
    if (lvl === 1) return "bg-blue-600 text-white";
    if (lvl === 2) return "bg-amber-600 text-white";
    if (lvl === 3) return "bg-rose-600 text-white";
    if (lvl === 4) return "bg-red-700 text-white";
    return "bg-slate-500 text-white";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs mb-3.5">
      {/* Explicit Section Label */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>AI-Assisted Screening Result</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
          Non-Diagnostic Screening Aid
        </span>
      </div>

      {/* Top Banner: DR Level and Referral Tag */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shadow-inner shrink-0 ${
            isUngradable ? "bg-slate-200 text-slate-700" : getLevelBadgeColor(drLevel)
          }`}>
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">ICDR</span>
            <span className="text-lg leading-none">
              {isUngradable ? "?" : `L${drLevel}`}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                {icdrCode}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                referableStatus === "Referable"
                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                  : referableStatus === "Non-Referable"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-100 text-slate-800 border border-slate-300"
              }`}>
                {referableStatus}
              </span>
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 mt-0.5 leading-snug">
              {severityLabel}
            </h2>
          </div>
        </div>

        {/* Confidence & Urgency */}
        <div className="text-right">
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {requiresReview ? "Uncalibrated score" : "Illustrative confidence"}
          </div>
          <div className="text-xl font-black font-mono text-slate-900 leading-tight">
            {isUngradable || !Number.isFinite(confidence) ? "Not assessed" : `${confidence.toFixed(1)}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Urgency: <strong className="text-slate-800">{referralUrgency}</strong>
          </div>
        </div>
      </div>

      {/* Uncertainty Tier Indicator - Highly Obvious */}
      <div className={`mb-2.5 p-2 rounded-lg border flex items-center justify-between gap-2 ${tier.badgeClass}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tier.dotClass} animate-pulse`} />
          <div>
            <div className="text-xs font-extrabold tracking-tight">
              {tier.name}
            </div>
            <div className="text-[10px] opacity-80 leading-tight">
              {tier.description}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Action / Guidance */}
      <div className="bg-teal-50/60 border border-teal-200/70 rounded-lg p-2.5 text-xs text-teal-950 flex items-start gap-2">
        <Activity className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-teal-950 block text-[11px]">
            REVIEW REQUIREMENT:
          </strong>
          {recommendation}
        </div>
      </div>
    </div>
  );
}
