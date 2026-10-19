import React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sliders,
  Eye,
  ShieldCheck,
  Tv,
  Crosshair,
  Move
} from "lucide-react";

export default function ImageToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  isFullscreen,
  onToggleFullscreen,
  brightness,
  onBrightnessChange,
  contrast,
  onContrastChange,
  is16x9Mode,
  onToggle16x9,
  eyeName = "Eye not provided",
  qualityScore,
  viewMode = "original",
  onViewModeChange,
  isUngradable = false,
  heatmapOpacity = 0.65,
  onHeatmapOpacityChange,
  showHotspots = true,
  onToggleHotspots,
  isFocusMode = false,
  onToggleFocusMode
}) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-3 py-2 text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: View Layers (Original, Enhanced, Grad-CAM, Compare/Split) */}
        <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onViewModeChange("original")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              viewMode === "original"
                ? "bg-teal-600 text-white shadow-2xs font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            Original Fundus
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("enhanced")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              viewMode === "enhanced"
                ? "bg-emerald-700 text-white shadow-2xs font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="Green Channel + CLAHE Microvascular Enhancement"
          >
            Enhanced
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("gradcam")}
            disabled={isUngradable}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              viewMode === "gradcam"
                ? "bg-amber-600 text-white shadow-2xs font-semibold"
                : isUngradable
                ? "text-slate-500 cursor-not-allowed"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="Grad-CAM Neural Attention Heatmap"
          >
            Grad-CAM Heatmap
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("split")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              viewMode === "split"
                ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
            title="Side-by-Side Dual Synchronized Comparison"
          >
            Compare View
          </button>
        </div>

        {/* Center: Image Adjustment Sliders with Medical Disclaimer */}
        <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-lg">
          {viewMode === "gradcam" && !isUngradable ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-300 font-medium">Heatmap Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => onHeatmapOpacityChange(parseFloat(e.target.value))}
                className="w-16 accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-[10px] text-slate-300 w-7">
                {Math.round(heatmapOpacity * 100)}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Bright:</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
                  className="w-14 accent-teal-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  title="Image Brightness Adjustment"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Contrast:</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={contrast}
                  onChange={(e) => onContrastChange(parseFloat(e.target.value))}
                  className="w-14 accent-teal-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  title="Image Contrast Adjustment"
                />
              </div>
              <span
                className="text-[9px] text-slate-400 hidden 2xl:inline border-l border-slate-700 pl-2"
                title="Visualization adjustment does not alter raw fundus tensors used for AI inference"
              >
                Display only • Does not alter AI inference
              </span>
            </div>
          )}
        </div>

        {/* Right: Zoom, Pan, Fit, 16:9, Focus Mode & Fullscreen */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md p-0.5">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] text-slate-300 px-1.5 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onResetZoom}
              className="px-1.5 py-0.5 rounded text-[10px] hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title="1:1 Native Resolution"
            >
              1:1
            </button>
            <button
              type="button"
              onClick={onFitToScreen}
              className="px-1.5 py-0.5 rounded text-[10px] hover:bg-slate-700 text-teal-400 hover:text-teal-300 font-semibold"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>

          {/* 16:9 Widescreen Toggle */}
          <button
            type="button"
            onClick={onToggle16x9}
            className={`p-1.5 rounded-md border text-xs font-semibold flex items-center gap-1 ${
              is16x9Mode
                ? "bg-teal-900/60 border-teal-500 text-teal-300"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title="Toggle 16:9 Widescreen Format"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">16:9</span>
          </button>

          {/* Clinical Focus Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-md border text-xs font-semibold flex items-center gap-1 ${
              isFocusMode
                ? "bg-indigo-900/70 border-indigo-400 text-indigo-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title="Enter Clinical Focus Mode (Expanded Image Workspace)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Focus Mode</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Examination View"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
