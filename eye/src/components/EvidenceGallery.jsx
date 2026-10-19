import React, { useState } from "react";
import { ZoomIn, Search, CheckCircle, ExternalLink, X } from "lucide-react";
import { generateRoiThumbnail } from "../utils/retinaImages.js";

export default function EvidenceGallery({ evidence = [], onSelectEvidence, isUngradable = false }) {
  const [selectedRoi, setSelectedRoi] = useState(null);
  const [inspectModalRoi, setInspectModalRoi] = useState(null);

  if (isUngradable || !evidence || evidence.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Evidence Regions (ROI Patches)
        </h3>
        <p className="text-xs text-slate-500 italic">
          No generated region-of-interest image is available for this screening.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Evidence Regions (ROI Patches)
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Image crops for review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {evidence.map((item) => {
          const isSelected = selectedRoi?.id === item.id;
          const thumbnailSrc = item.imageUrl || generateRoiThumbnail(item.id);

          let badgeStyle = item.badgeColor === "slate"
            ? "bg-slate-100 text-slate-700 border-slate-300"
            : "bg-amber-100 text-amber-800 border-amber-300";
          if (item.badgeColor === "rose" || item.badgeColor === "red") {
            badgeStyle = "bg-rose-100 text-rose-800 border-rose-300";
          } else if (item.badgeColor === "emerald") {
            badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300";
          } else if (item.badgeColor === "purple") {
            badgeStyle = "bg-purple-100 text-purple-800 border-purple-300";
          }

          return (
            <div
              key={item.id}
              onClick={() => {
                setSelectedRoi(item);
                if (onSelectEvidence) onSelectEvidence(item);
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-teal-500 bg-teal-50/40 shadow-sm ring-1 ring-teal-400"
                  : "border-slate-200 hover:border-teal-300 bg-slate-50/70"
              }`}
            >
              <div>
                {/* ROI Header & Magnification */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.id}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono">
                    {item.magnification}
                  </span>
                </div>

                {/* Visual Retinal Patch Image */}
                <div className="relative mb-2.5 rounded-lg overflow-hidden border border-slate-300 bg-black aspect-square flex items-center justify-center group">
                  <img
                    src={thumbnailSrc}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-white backdrop-blur-xs flex items-center gap-1">
                    <ZoomIn className="w-3 h-3 text-teal-400" />
                    <span>Zoom</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectModalRoi(item);
                    }}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                  >
                    Inspect ROI
                  </button>
                </div>

                {/* Title & Location */}
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">
                  {item.name}
                </h4>
                <div className="text-[11px] text-slate-500 mb-2">
                  Location: <span className="font-semibold text-slate-700">{item.location}</span>
                </div>

                {/* Region description */}
                <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/70 mb-2.5 leading-snug">
                  {item.finding}
                </p>
              </div>

              {/* Diagnostic Relevance Badge */}
              <div className={`text-[10px] font-semibold px-2 py-1 rounded border ${badgeStyle} mt-auto`}>
                Interpretation: {item.relevance}
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Resolution Inspection Modal */}
      {inspectModalRoi && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                  {inspectModalRoi.id}
                </span>
                <h3 className="font-bold text-sm text-slate-900">{inspectModalRoi.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalRoi(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-300 mb-3 bg-black flex items-center justify-center">
              <img
                src={inspectModalRoi.imageUrl || generateRoiThumbnail(inspectModalRoi.id, 320, 320)}
                alt={inspectModalRoi.name}
                className="w-full max-h-64 object-contain"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Region description:</span>
                <p className="text-slate-800 font-medium">{inspectModalRoi.finding}</p>
              </div>

              <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-200 text-teal-950">
                <span className="font-bold block text-[11px]">Interpretation:</span>
                <p>{inspectModalRoi.relevance}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalRoi(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
