import React, { useState } from "react";
import { Columns, SplitSquareVertical, Eye, Sparkles } from "lucide-react";

export default function CompareViewer({
  originalUrl,
  enhancedUrl,
  gradCamUrl,
  previousUrl,
  isUngradable = false
}) {
  const [leftMode, setLeftMode] = useState("original"); // "original" | "previous"
  const [rightMode, setRightMode] = useState("enhanced"); // "enhanced" | "gradcam"

  const getImageUrl = (mode) => {
    switch (mode) {
      case "original":
        return originalUrl;
      case "enhanced":
        return enhancedUrl;
      case "gradcam":
        return gradCamUrl;
      case "previous":
        return originalUrl; // simulated baseline fundus
      default:
        return originalUrl;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Header with dual selectors */}
      <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <SplitSquareVertical className="w-4 h-4 text-teal-700" />
          <span>Synchronized Split-Screen Optical Comparison</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Left:</span>
            <select
              value={leftMode}
              onChange={(e) => setLeftMode(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 font-medium"
            >
              <option value="original">Original Fundus</option>
              <option value="previous">Previous Screening</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Right:</span>
            <select
              value={rightMode}
              onChange={(e) => setRightMode(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 font-medium"
            >
              <option value="enhanced">Enhanced (Green CLAHE)</option>
              <option value="gradcam" disabled={isUngradable}>Grad-CAM Heatmap</option>
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-side Dual Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-950">
        {/* Left Viewport */}
        <div className="p-3 flex flex-col items-center justify-center relative min-h-[300px]">
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-semibold border border-slate-700">
            {leftMode === "original" ? "Current Original" : "Prior Baseline"}
          </div>
          <img
            src={getImageUrl(leftMode)}
            alt="Left comparative fundus"
            className="max-h-[340px] w-auto object-contain rounded-lg shadow-inner"
          />
        </div>

        {/* Right Viewport */}
        <div className="p-3 flex flex-col items-center justify-center relative min-h-[300px]">
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-semibold border border-slate-700">
            {rightMode === "enhanced" ? "Green Channel CLAHE" : "Grad-CAM Saliency"}
          </div>
          <div className="relative">
            <img
              src={getImageUrl(rightMode)}
              alt="Right comparative view"
              className="max-h-[340px] w-auto object-contain rounded-lg shadow-inner"
            />
            {rightMode === "gradcam" && gradCamUrl && !isUngradable && (
              <img
                src={gradCamUrl}
                alt="Grad-CAM Overlay"
                className="absolute inset-0 max-h-[340px] w-auto object-contain pointer-events-none mix-blend-screen opacity-75"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
