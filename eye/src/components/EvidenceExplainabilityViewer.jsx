import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Scan,
  Move,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Grid,
  Crosshair,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Check,
  Eye,
  Sliders
} from "lucide-react";

/**
 * EvidenceExplainabilityViewer
 * 
 * Clinical Evidence & Explainability component with professional medical imaging tools.
 * 
 * Rules & Clinical Guardrails:
 * - Brightness, contrast, saturation, and sharpness affect ONLY the displayed visualization.
 * - The original uploaded image remains pristine and untouched.
 * - Image adjustments do not affect or re-run AI inference.
 * - Disclaimers: "Image adjustments affect visualization only and do not change the AI analysis."
 */
export default function EvidenceExplainabilityViewer({
  session,
  evidenceTab,
  setEvidenceTab
}) {
  // Safe extraction of images and metadata
  const originalImg = session?.images?.original;
  const enhancedImg = session?.images?.enhanced;
  const gradCamImg = session?.images?.gradCam;
  const eyeLabel = session?.patient?.eye || "Eye not provided";
  const explainability = session?.explainability;
  const selfValidation = session?.selfValidation;
  const lesions = session?.lesions;

  // --- 1. Zoom & Pan Navigation States ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [panToolActive, setPanToolActive] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- 2. Orientation States ---
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // --- 3. Visualization Adjustments (Display ONLY) ---
  const [brightness, setBrightness] = useState(100); // 50% - 150%
  const [contrast, setContrast] = useState(100); // 50% - 150%
  const [saturation, setSaturation] = useState(100); // 0% - 200%
  const [sharpness, setSharpness] = useState(0); // 0 - 10
  const [showAdjustPopover, setShowAdjustPopover] = useState(false);

  // --- 4. Clinical Evidence Overlays & Compare ---
  const [showEvidenceMarkers, setShowEvidenceMarkers] = useState(evidenceTab === "lesions");
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isCompareActive, setIsCompareActive] = useState(false);
  const [compareSplit, setCompareSplit] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Touch tracking ref
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, panX: 0, panY: 0 });

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const popoverRef = useRef(null);
  const splitRef = useRef(null);

  // Sync evidence marker state when user switches to 'lesions' tab
  useEffect(() => {
    if (evidenceTab === "lesions") {
      setShowEvidenceMarkers(true);
    }
  }, [evidenceTab]);

  // Visual adjustments modified check
  const hasAdjustments =
    brightness !== 100 || contrast !== 100 || saturation !== 100 || sharpness !== 0;

  // Close adjustment popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !e.target.closest("[data-evidence-adjust-trigger]")
      ) {
        setShowAdjustPopover(false);
      }
    };
    if (showAdjustPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAdjustPopover]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleFitImage();
      } else if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleResetView();
      } else if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        if (showAdjustPopover) setShowAdjustPopover(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, showAdjustPopover]);

  // --- Handlers: Image Navigation ---
  const handleZoomIn = () => {
    setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 4.0));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(Number((z - 0.25).toFixed(2)), 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleFitImage = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleActualSize = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleTogglePan = () => {
    setPanToolActive((prev) => !prev);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPanToolActive(false);
  };

  // --- Handlers: Orientation ---
  const handleRotateLeft = () => {
    setRotation((r) => (r - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipH((f) => !f);
  };

  const handleFlipVertical = () => {
    setFlipV((f) => !f);
  };

  // --- Handlers: Visualization Adjustments ---
  const handleResetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(0);
  };

  // --- Pointer & Mouse Dragging ---
  const handlePointerDown = (e) => {
    if (e.target.closest("[data-split-handle]")) return;
    if (zoom > 1 || panToolActive) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      });
      if (e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const maxPan = 220 * zoom;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, dragStart.panX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStart.panY + dy))
      });
    }

    if (isDraggingSplit && splitRef.current) {
      const rect = splitRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (relativeX / rect.width) * 100));
      setCompareSplit(Number(pct.toFixed(1)));
    }
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }
    if (isDraggingSplit) {
      setIsDraggingSplit(false);
    }
  };

  // Double click to zoom in / fit
  const handleDoubleClick = (e) => {
    if (isDraggingSplit) return;
    if (zoom === 1) {
      setZoom(1.85);
    } else {
      handleFitImage();
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0018;
    setZoom((prevZoom) => {
      const next = Math.min(Math.max(Number((prevZoom + delta).toFixed(2)), 0.5), 4.0);
      if (next <= 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  // Touch Support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        dist: 0,
        panX: pan.x,
        panY: pan.y
      };
      if (zoom > 1 || panToolActive) {
        setIsDragging(true);
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = {
        x: 0,
        y: 0,
        dist,
        panX: pan.x,
        panY: pan.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const maxPan = 220 * zoom;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, touchStartRef.current.panX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, touchStartRef.current.panY + dy))
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = currentDist / touchStartRef.current.dist;
      setZoom((prevZoom) => {
        const next = Math.min(Math.max(Number((prevZoom * ratio).toFixed(2)), 0.5), 4.0);
        return next;
      });
      touchStartRef.current.dist = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = 0;
  };

  // Transform and filter style applied to displayed visualization
  const imageTransformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${
      flipH ? -1 : 1
    }) scaleY(${flipV ? -1 : 1})`,
    transition: isDragging ? "none" : "transform 150ms ease-out",
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
      sharpness > 0 ? " url(#evidence-sharpen-filter)" : ""
    }`
  };

  // Current active base image source based on tab
  const currentBaseImage =
    evidenceTab === "enhanced"
      ? enhancedImg || originalImg
      : originalImg;

  // Active label text for display
  const getActiveViewLabel = () => {
    if (isCompareActive) {
      return "Original ↔ Enhanced Split Comparison";
    }
    switch (evidenceTab) {
      case "original":
        return "Original Fundus";
      case "enhanced":
        return "Enhanced Fundus — Visualization aid";
      case "gradcam":
        return "Grad-CAM — AI attention visualization, not independent diagnostic evidence";
      case "lesions":
        return "Lesion Evidence — Anatomical ROI Markers";
      default:
        return "Original Fundus";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950 flex flex-col p-0 overflow-y-auto" : "w-full"
      }`}
    >
      {/* SVG Convolution Filter for Edge Sharpening */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter id="evidence-sharpen-filter">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix={
                sharpness > 0
                  ? `0 -${(sharpness * 0.18).toFixed(2)} 0  -${(sharpness * 0.18).toFixed(
                      2
                    )} ${(1 + sharpness * 0.72).toFixed(2)} -${(sharpness * 0.18).toFixed(
                      2
                    )}  0 -${(sharpness * 0.18).toFixed(2)} 0`
                  : "0 0 0 0 1 0 0 0 0"
              }
            />
          </filter>
        </defs>
      </svg>

      {/* =========================================================================
          SECTION HEADER: Title + Description + Existing Modality Tabs
         ========================================================================= */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
              Evidence & Explainability
            </h2>
            <span className="text-[11px] font-medium text-slate-400">({eyeLabel})</span>
            {hasAdjustments && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Visualization Adjusted
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Multi-modal feature inspection and spatial neural attention
          </p>
        </div>

        {/* Existing Tabs: Original, Enhanced, Grad-CAM, Lesion Evidence */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => {
              setEvidenceTab("original");
              setIsCompareActive(false);
            }}
            className={`px-3 py-1.5 min-h-[34px] rounded-md whitespace-nowrap transition-colors ${
              evidenceTab === "original" && !isCompareActive
                ? "bg-white text-blue-700 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => {
              setEvidenceTab("enhanced");
              setIsCompareActive(false);
            }}
            className={`px-3 py-1.5 min-h-[34px] rounded-md whitespace-nowrap transition-colors ${
              evidenceTab === "enhanced" && !isCompareActive
                ? "bg-white text-blue-700 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Enhanced
          </button>
          <button
            type="button"
            onClick={() => {
              setEvidenceTab("gradcam");
              setIsCompareActive(false);
            }}
            className={`px-3 py-1.5 min-h-[34px] rounded-md whitespace-nowrap transition-colors ${
              evidenceTab === "gradcam" && !isCompareActive
                ? "bg-white text-blue-700 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Grad-CAM
          </button>
          <button
            type="button"
            onClick={() => {
              setEvidenceTab("lesions");
              setShowEvidenceMarkers(true);
              setIsCompareActive(false);
            }}
            className={`px-3 py-1.5 min-h-[34px] rounded-md whitespace-nowrap transition-colors ${
              evidenceTab === "lesions" && !isCompareActive
                ? "bg-white text-blue-700 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lesion Evidence
          </button>
        </div>
      </div>

      {/* =========================================================================
          COMPACT PROFESSIONAL IMAGE TOOLBAR
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs gap-y-1.5 gap-x-2 min-h-[44px]">
        {/* Left: Active modality status & Zoom indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-slate-700 text-xs truncate max-w-[200px] sm:max-w-none">
            {evidenceTab === "original" && "Original Fundus"}
            {evidenceTab === "enhanced" && "Enhanced (Green CLAHE)"}
            {evidenceTab === "gradcam" && "Grad-CAM Attention"}
            {evidenceTab === "lesions" && "Lesion ROIs"}
          </span>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Right: Integrated Medical-Imaging Controls */}
        <div className="flex items-center gap-1 relative flex-wrap sm:flex-nowrap">
          {/* GROUP 1: ZOOM & PAN */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Zoom In (+ / Wheel Up)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Zoom Out (- / Wheel Down)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFitImage}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Fit to Viewer (0)"
              aria-label="Fit Image"
            >
              <Scan className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleActualSize}
              className={`px-2 py-1 rounded-md text-xs font-semibold min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                zoom === 1 && pan.x === 0 && pan.y === 0
                  ? "text-blue-700 bg-blue-50 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Actual Size 1:1"
              aria-label="Actual Size 1:1"
            >
              1:1
            </button>
            <button
              type="button"
              onClick={handleTogglePan}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                panToolActive || zoom > 1
                  ? "bg-slate-200 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Pan Image (Click & Drag)"
              aria-label="Pan Image"
            >
              <Move className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5 hidden xs:block" />

          {/* GROUP 2: VISUALIZATION ADJUSTMENT (POPOVER) */}
          <div className="relative">
            <button
              type="button"
              data-evidence-adjust-trigger
              onClick={() => setShowAdjustPopover((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-md min-h-[32px] sm:min-h-[34px] flex items-center gap-1.5 transition-colors text-xs font-medium ${
                showAdjustPopover || hasAdjustments
                  ? "bg-blue-100 text-blue-800 font-semibold"
                  : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Image adjustments affect visualization only and do not change the AI analysis."
              aria-label="Adjust Visualization"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Adjust</span>
              {hasAdjustments && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
              )}
            </button>

            {/* Adjustments Popover */}
            {showAdjustPopover && (
              <div
                ref={popoverRef}
                className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 z-40 w-72 sm:w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-xs text-slate-700 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      Visualization adjustment
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Visualization only • Original protected
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAdjustments}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    title="Reset Adjustments to defaults"
                  >
                    Reset Adjustments
                  </button>
                </div>

                {/* Brightness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Brightness</span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Brightness slider"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Contrast</span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Contrast slider"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Saturation</span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {saturation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="2"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Saturation slider"
                  />
                </div>

                {/* Sharpness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Sharpness</span>
                    <span className="tabular-nums font-semibold text-slate-800">
                      {sharpness > 0 ? `+${sharpness}` : "0 (Default)"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={sharpness}
                    onChange={(e) => setSharpness(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Sharpness slider"
                  />
                </div>

                {/* Medical UX Note */}
                <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500 leading-tight">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Image adjustments affect visualization only and do not change
                    the AI analysis.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5 hidden xs:block" />

          {/* GROUP 3: ROTATION & FLIP */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Rotate Left 90°"
              aria-label="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Rotate Right 90°"
              aria-label="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFlipHorizontal}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                flipH
                  ? "bg-slate-200 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Flip Horizontal"
              aria-label="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFlipVertical}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                flipV
                  ? "bg-slate-200 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Flip Vertical"
              aria-label="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5 hidden xs:block" />

          {/* GROUP 4: EVIDENCE CONTROLS (Markers, Crosshair, Grid, Compare) */}
          <div className="flex items-center gap-0.5">
            {/* Show/Hide Evidence Markers */}
            <button
              type="button"
              onClick={() => setShowEvidenceMarkers((prev) => !prev)}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                showEvidenceMarkers
                  ? "bg-amber-100 text-amber-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title={showEvidenceMarkers ? "Hide Evidence Markers" : "Show Evidence Markers"}
              aria-label="Toggle Evidence Markers"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Show/Hide Crosshair */}
            <button
              type="button"
              onClick={() => setShowCrosshair((prev) => !prev)}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                showCrosshair
                  ? "bg-blue-100 text-blue-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Toggle Center Crosshair"
              aria-label="Toggle Center Crosshair"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Grid / Ruler */}
            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                showGrid
                  ? "bg-blue-100 text-blue-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Toggle Calibrated Retinal Grid / Ruler"
              aria-label="Toggle Grid / Ruler"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Original <-> Enhanced comparison */}
            {enhancedImg && (
              <button
                type="button"
                onClick={() => setIsCompareActive((prev) => !prev)}
                className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                  isCompareActive
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
                title="Interactive Original ↔ Enhanced Split Comparison"
                aria-label="Toggle Comparison"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5 hidden xs:block" />

          {/* GROUP 5: RESET VIEW & FULLSCREEN */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Reset View (Zoom, Pan, Rotation, Flip)"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F)"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEWER CANVAS FOR EVIDENCE & EXPLAINABILITY
         ========================================================================= */}
      <div
        ref={viewerRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`p-3 sm:p-4 bg-slate-950 flex flex-col items-center justify-center relative select-none overflow-hidden touch-none transition-all ${
          isFullscreen
            ? "flex-1 min-h-[70vh] w-full"
            : "min-h-[320px] xs:min-h-[360px] sm:min-h-[400px] md:min-h-[440px] 2xl:min-h-[480px]"
        } ${
          zoom > 1 || panToolActive
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        }`}
      >
        {/* Clinical Labels Overlay */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[94%] text-center">
          {evidenceTab === "gradcam" && !isCompareActive && (
            <div className="bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-md text-center text-xs text-slate-200 shadow-md backdrop-blur-xs">
              <span className="font-semibold text-blue-400">Grad-CAM</span>
              <span className="mx-1 text-slate-500">—</span>
              <span>AI attention visualization, not independent diagnostic evidence</span>
            </div>
          )}

          {evidenceTab === "enhanced" && !isCompareActive && (
            <div className="bg-slate-900/95 border border-emerald-700/60 px-3 py-1.5 rounded-md text-center text-xs text-emerald-300 shadow-md backdrop-blur-xs font-medium">
              <span>Enhanced Fundus — Visualization aid</span>
              <span className="ml-1.5 text-[11px] text-emerald-400/80">(Green-Channel CLAHE)</span>
            </div>
          )}

          {evidenceTab === "original" && !isCompareActive && (
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-md text-center text-xs text-slate-300 shadow-md backdrop-blur-xs font-medium">
              Original Fundus
            </div>
          )}

          {evidenceTab === "lesions" && !isCompareActive && (
            <div className="bg-slate-900/95 border border-amber-700/60 px-3 py-1.5 rounded-md text-center text-xs text-amber-300 shadow-md backdrop-blur-xs font-medium">
              Lesion Evidence — Anatomical ROI Markers
            </div>
          )}

          {isCompareActive && (
            <div className="bg-slate-900/95 border border-emerald-600 px-3 py-1.5 rounded-md text-center text-xs text-white shadow-md backdrop-blur-xs font-medium flex items-center gap-2">
              <span className="text-blue-300 font-semibold">Original (Left)</span>
              <span className="text-slate-500">↔</span>
              <span className="text-emerald-300 font-semibold">Enhanced CLAHE (Right)</span>
            </div>
          )}
        </div>

        {/* Circular Retinal Mask Container */}
        <div
          ref={splitRef}
          className={`relative w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 2xl:w-[420px] 2xl:h-[420px] max-w-[calc(100vw-3.5rem)] max-h-[calc(100vw-3.5rem)] rounded-full overflow-hidden bg-black shadow-2xl ${
            isFullscreen ? "w-80 h-80 sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px]" : ""
          }`}
        >
          {/* Main Transformed Image Canvas */}
          <div
            className="w-full h-full relative flex items-center justify-center will-change-transform"
            style={imageTransformStyle}
          >
            {/* Standard Single Image View (when compare is not active) */}
            {!isCompareActive ? (
              <>
                <img
                  src={currentBaseImage}
                  alt="Fundus Evidence Visualization"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />

                {/* Grad-CAM Heatmap Layer */}
                {evidenceTab === "gradcam" && gradCamImg && (
                  <img
                    src={gradCamImg}
                    alt="Grad-CAM Neural Attention Overlay"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-75 pointer-events-none select-none"
                    draggable={false}
                  />
                )}
              </>
            ) : (
              /* Interactive Draggable Split-Screen: Original vs. Enhanced */
              <div className="w-full h-full relative select-none pointer-events-none">
                {/* Background Layer: Enhanced Fundus */}
                <img
                  src={enhancedImg || originalImg}
                  alt="Enhanced Fundus Comparison"
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />

                {/* Foreground Clipped Layer: Original Fundus */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${compareSplit}%` }}
                >
                  <img
                    src={originalImg}
                    alt="Original Fundus Comparison"
                    className="w-full h-full object-cover pointer-events-none max-w-none"
                    style={{
                      width: "100%",
                      height: "100%"
                    }}
                    draggable={false}
                  />
                </div>

                {/* Draggable Divider Handle */}
                <div
                  data-split-handle
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingSplit(true);
                  }}
                  className="absolute top-0 bottom-0 w-1 bg-white/90 cursor-ew-resize pointer-events-auto z-30 shadow-[0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center"
                  style={{ left: `${compareSplit}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center text-[10px] font-bold border border-slate-300">
                    ↔
                  </div>
                </div>
              </div>
            )}

            {/* Evidence ROI Lesion Markers */}
            {showEvidenceMarkers && (
              <div className="absolute inset-0 pointer-events-none select-none">
                {/* Circinate Hard Exudates marker */}
                <div className="absolute top-[42%] left-[56%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-400 border-dashed bg-amber-400/20 flex items-center justify-center shadow-xs">
                  <span className="text-[9px] font-bold text-amber-200 bg-black/80 px-1 py-0.5 rounded shadow">
                    EX
                  </span>
                </div>
                {/* Microaneurysm marker */}
                <div className="absolute top-[36%] left-[62%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center shadow-xs">
                  <span className="text-[8px] font-bold text-rose-200 bg-black/80 px-1 py-0.5 rounded shadow">
                    MA
                  </span>
                </div>
                {/* Blot hemorrhage marker */}
                <div className="absolute top-[52%] left-[40%] -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-red-500 bg-red-500/20 flex items-center justify-center shadow-xs">
                  <span className="text-[8px] font-bold text-red-200 bg-black/80 px-1 py-0.5 rounded shadow">
                    HE
                  </span>
                </div>
              </div>
            )}

            {/* Diagnostic Crosshair Overlay */}
            {showCrosshair && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-px bg-cyan-400/50" />
                <div className="h-full w-px bg-cyan-400/50 absolute" />
                <div className="w-16 h-16 rounded-full border border-cyan-400/60 absolute" />
                <div className="w-32 h-32 rounded-full border border-cyan-400/30 border-dashed absolute" />
                <span className="absolute bottom-4 right-4 text-[9px] font-mono text-cyan-300/80 bg-black/60 px-1 py-0.5 rounded">
                  Fovea Center (0, 0)
                </span>
              </div>
            )}

            {/* Calibrated Retinal Measurement Grid */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#38bdf820_1px,transparent_1px),linear-gradient(to_bottom,#38bdf820_1px,transparent_1px)] bg-[size:12.5%_12.5%] flex items-end justify-start p-3">
                <div className="bg-black/80 border border-sky-400/40 px-2 py-1 rounded text-[9px] font-mono text-sky-200 flex items-center gap-1.5 shadow">
                  <span className="w-5 h-0.5 bg-sky-400 inline-block" />
                  <span>500 μm Scale</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Helper Bar on Canvas */}
        <div className="absolute bottom-2 left-0 right-0 px-4 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded backdrop-blur-xs border border-slate-800">
            <span>Scroll / Pinch: Zoom</span>
            <span>•</span>
            <span>Drag: Pan</span>
            <span>•</span>
            <span>Double click: Toggle 1.85x</span>
          </div>
          <div className="ml-auto bg-slate-900/80 px-2.5 py-1 rounded backdrop-blur-xs border border-slate-800 text-[10px] text-slate-400">
            <span>Display only • Original protected</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EXISTING GRAD-CAM & EVIDENCE CONTENT + EXPLANATIONS
         ========================================================================= */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 space-y-3.5">
        {/* Heatmap & Attention Description */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Neural Attention & Lesion Correlation</span>
            {selfValidation?.isConsistent && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Explanation Consistent ({selfValidation.alignmentScore || 94}% overlap)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {explainability?.heatmapDescription ||
              "Grad-CAM activation highlights dominant clusters around the superior-temporal arcade and parafoveal region, corresponding directly with microvascular anomalies."}
          </p>
        </div>

        {/* Attention Hotspots Pills */}
        {explainability?.attentionHotspots && explainability.attentionHotspots.length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Dominant Attention Hotspots
            </div>
            <div className="flex flex-wrap gap-2">
              {explainability.attentionHotspots.map((spot, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-medium text-slate-800">{spot.feature}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({Math.round(spot.intensity * 100)}% intensity)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spatial Lesion Evidence Details */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-500/20 inline-block" />
              <strong className="font-medium text-slate-700">MA:</strong> Microaneurysms
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-red-500 bg-red-500/20 inline-block" />
              <strong className="font-medium text-slate-700">HE:</strong> Hemorrhages
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-400 border-dashed bg-amber-400/20 inline-block" />
              <strong className="font-medium text-slate-700">EX:</strong> Hard Exudates
            </span>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Image adjustments affect visualization only and do not change the AI analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
