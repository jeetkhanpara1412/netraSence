import React, { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sliders,
  Crosshair,
  Info,
  Tv,
  Eye,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import ImageToolbar from "./ImageToolbar.jsx";
import CompareViewer from "./CompareViewer.jsx";

export default function FundusViewer({
  images,
  hotspots = [],
  isUngradable = false,
  qualityScore,
  eyeName = "Eye not provided",
  activeLayers = {
    vessels: true,
    opticDisc: true,
    fovea: true,
    lesions: true
  },
  onToggleFocusMode,
  isFocusMode = false
}) {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState("original"); // "original" | "enhanced" | "gradcam" | "split"
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.65);
  const [showHotspots, setShowHotspots] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is16x9Mode, setIs16x9Mode] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setBrightness(1);
    setContrast(1);
  };
  const handleFitToScreen = () => setZoom(1);

  const originalImg = images?.original;
  const enhancedImg = images?.enhanced;
  const gradCamImg = images?.gradCam;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs ${
      isFullscreen ? "fixed inset-0 z-50 p-4 sm:p-6 flex flex-col bg-slate-950 border-none" : "mb-3"
    }`}>
      {/* Integrated Clinical Image Toolbar */}
      <ImageToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitToScreen={handleFitToScreen}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        brightness={brightness}
        onBrightnessChange={setBrightness}
        contrast={contrast}
        onContrastChange={setContrast}
        is16x9Mode={is16x9Mode}
        onToggle16x9={() => setIs16x9Mode(!is16x9Mode)}
        eyeName={eyeName}
        qualityScore={qualityScore}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isUngradable={isUngradable}
        heatmapOpacity={heatmapOpacity}
        onHeatmapOpacityChange={setHeatmapOpacity}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots(!showHotspots)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={onToggleFocusMode}
      />

      {/* Main Clinical Canvas Viewport */}
      <div className={`relative bg-slate-950 flex items-center justify-center overflow-hidden select-none ${
        isFullscreen
          ? "flex-1 min-h-[500px]"
          : is16x9Mode
          ? "w-full aspect-[16/9] max-h-[480px] min-h-[360px]"
          : "h-[420px] md:h-[460px]"
      }`}>
        {/* Grad-CAM Diagnostic Caution Banner */}
        {viewMode === "gradcam" && !isUngradable && (
          <div className="absolute top-2.5 z-20 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-950/90 border border-amber-500/60 rounded-full shadow-lg text-[11px] text-amber-200 font-medium flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>AI attention visualization — does not constitute independent diagnostic evidence.</span>
          </div>
        )}

        {/* Optical 16:9 Diagnostic Telemetry HUD (Left & Right Wings) */}
        {is16x9Mode && viewMode !== "split" && (
          <>
            {/* Left Telemetry HUD */}
            <div className="absolute left-3 top-3 bottom-10 w-28 hidden md:flex flex-col justify-between text-[10px] font-mono text-slate-400 pointer-events-none z-10">
              <div className="bg-slate-900/80 backdrop-blur-xs p-2 rounded border border-slate-800 space-y-1">
                <div className="text-teal-400 font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" /> FIELD: NOT PROVIDED
                </div>
                <div>RESOLUTION: NOT PROVIDED</div>
                <div>EYE: {eyeName.split(" ")[0]}</div>
                <div>QA: {qualityScore == null ? "NOT ASSESSED" : `${qualityScore}%`}</div>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 text-[9px] text-slate-400">
                CAMERA: NOT PROVIDED
                <br />
                ACQUISITION: NOT PROVIDED
              </div>
            </div>

            {/* Right Telemetry HUD */}
            <div className="absolute right-3 top-3 bottom-10 w-32 hidden md:flex flex-col justify-between text-[10px] font-mono text-slate-400 pointer-events-none z-10 text-right">
              <div className="bg-slate-900/80 backdrop-blur-xs p-2 rounded border border-slate-800 space-y-1 text-right">
                <div className="text-amber-400 font-bold flex items-center justify-end gap-1">
                  <Activity className="w-3 h-3" /> VISUALIZATION
                </div>
                <div>MODEL: NOT PROVIDED</div>
                <div>MAP: {images?.gradCam ? "AVAILABLE" : "NOT AVAILABLE"}</div>
                <div>LATENCY: NOT MEASURED</div>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 text-[9px] text-slate-400">
                ICDR STANDARD
                <br />
                CALIBRATION NOT ESTABLISHED
              </div>
            </div>
          </>
        )}

        {viewMode === "split" ? (
          // Side-by-Side Comparison
          <div className="w-full h-full p-2 flex items-center justify-center">
            <CompareViewer
              originalUrl={originalImg}
              enhancedUrl={enhancedImg}
              gradCamUrl={gradCamImg}
              isUngradable={isUngradable}
            />
          </div>
        ) : (
          // Single Image / Multi-layer Stack View
          <div
            className="relative aspect-square w-[290px] h-[290px] sm:w-[350px] sm:h-[350px] md:w-[390px] md:h-[390px] lg:w-[410px] lg:h-[410px] rounded-full overflow-hidden shadow-2xl bg-black transition-transform duration-150 shrink-0 border-2 border-slate-800"
            style={{
              transform: `scale(${zoom})`,
              filter: `brightness(${brightness}) contrast(${contrast})`
            }}
          >
            {/* Base Image depending on viewMode */}
            <img
              src={viewMode === "enhanced" ? enhancedImg : originalImg}
              alt="Retinal Fundus"
              className="w-full h-full object-cover select-none"
            />

            {/* Grad-CAM Heatmap Overlay */}
            {viewMode === "gradcam" && !isUngradable && gradCamImg && (
              <img
                src={gradCamImg}
                alt="Grad-CAM Activation"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen"
                style={{ opacity: heatmapOpacity }}
              />
            )}

            {/* Anatomical Structural Overlays when enabled */}
            {/* Optic Disc Ring Annotation */}
            {activeLayers?.opticDisc && (
              <div
                className="absolute w-14 h-14 rounded-full border border-dashed border-amber-400/80 pointer-events-none"
                style={{ left: "22%", top: "45%", transform: "translate(-50%, -50%)" }}
                title="Optic Disc Margin"
              >
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-300 bg-slate-950/70 px-1 rounded">
                  OD
                </span>
              </div>
            )}

            {/* Fovea / Macula Ring Annotation */}
            {activeLayers?.fovea && (
              <div
                className="absolute w-12 h-12 rounded-full border border-yellow-400/70 pointer-events-none"
                style={{ left: "54%", top: "48%", transform: "translate(-50%, -50%)" }}
                title="Fovea / Avascular Zone"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-yellow-300 bg-slate-950/70 px-1 rounded">
                  FAZ
                </span>
              </div>
            )}

            {/* Pathological Hotspot Pins */}
            {activeLayers?.lesions && (viewMode === "gradcam" || viewMode === "original" || viewMode === "enhanced") && showHotspots && hotspots.map((spot, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setActiveTooltip(spot)}
                onMouseLeave={() => setActiveTooltip(null)}
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              >
                <div className="w-5 h-5 rounded-full border-2 border-white bg-rose-600 shadow-lg flex items-center justify-center text-[10px] font-bold text-white hover:scale-125 transition-transform">
                  {idx + 1}
                </div>
              </div>
            ))}

            {/* Hotspot Floating Tooltip */}
            {activeTooltip && (
              <div
                style={{ left: `${activeTooltip.x}%`, top: `${activeTooltip.y - 10}%` }}
                className="absolute -translate-x-1/2 -translate-y-full z-30 bg-slate-900/95 text-white px-2.5 py-1.5 rounded-md border border-slate-700 shadow-xl text-xs pointer-events-none whitespace-nowrap backdrop-blur-sm"
              >
                <div className="font-bold text-teal-300">{activeTooltip.feature}</div>
                <div className="text-[10px] text-slate-300">
                  Saliency Weight: {(activeTooltip.intensity * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Floating Legend / Metadata */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-800 text-slate-300 truncate max-w-[65%]">
            {viewMode === "original" && "Uploaded source image; capture details not provided"}
            {viewMode === "enhanced" && "Contrast-enhanced visualization; not a lesion detection result"}
            {viewMode === "gradcam" && "Model-attention visualization; not independent diagnostic evidence"}
            {viewMode === "split" && "Dual View: Split Comparison Mode"}
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-800 text-teal-400 font-mono text-[10px] sm:text-[11px]">
            {is16x9Mode ? "16:9 VIEWPORT" : "STD"} | FOV: NOT PROVIDED | QA: {qualityScore == null ? "NOT ASSESSED" : `${qualityScore}%`}
          </div>
        </div>
      </div>
    </div>
  );
}
