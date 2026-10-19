import React, { useState, useRef, useEffect, useCallback } from "react";
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
  X,
  Eye,
  Check
} from "lucide-react";

/**
 * FundusClinicalViewer
 * 
 * Professional clinical fundus image viewer with doctor-friendly inspection tools.
 * 
 * Critical Medical Rules:
 * - Visualization adjustments (brightness, contrast, saturation, sharpness, orientation)
 *   affect displayed visualization ONLY and NEVER modify the original uploaded image
 *   or underlying AI inferencing.
 * - Original image is strictly preserved and recoverable at any time.
 * - Clear clinical disclaimers are maintained.
 */
export default function FundusClinicalViewer({
  session,
  images,
  patient,
  quality,
  lesions,
  isUngradable = false
}) {
  // Extract images and patient info safely
  const originalImg = session?.images?.original || images?.original;
  const enhancedImg = session?.images?.enhanced || images?.enhanced;
  const eyeLabel = patient?.eye || session?.patient?.eye || "Eye not provided";
  const qualityStatus = quality?.status || session?.quality?.status || "Not assessed";

  // --- 1. Navigation States ---
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

  // --- 3. Visualization Adjustments (Display only) ---
  const [brightness, setBrightness] = useState(100); // 50% - 150%
  const [contrast, setContrast] = useState(100); // 50% - 150%
  const [saturation, setSaturation] = useState(100); // 0% - 200%
  const [sharpness, setSharpness] = useState(0); // 0 - 10
  const [showAdjustPopover, setShowAdjustPopover] = useState(false);

  // --- 4. Secondary Professional Overlays ---
  const [showGrid, setShowGrid] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [showEvidenceMarkers, setShowEvidenceMarkers] = useState(false);
  const [isCompareActive, setIsCompareActive] = useState(false);
  const [compareSplit, setCompareSplit] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Touch tracking
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0, panX: 0, panY: 0 });

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const popoverRef = useRef(null);
  const splitRef = useRef(null);

  // Whether visual adjustments are currently active (non-default)
  const hasAdjustments =
    brightness !== 100 || contrast !== 100 || saturation !== 100 || sharpness !== 0;

  // Whether orientation is modified
  const hasOrientation = rotation !== 0 || flipH || flipV;

  // Close adjustment popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !e.target.closest("[data-adjust-trigger]")
      ) {
        setShowAdjustPopover(false);
      }
    };
    if (showAdjustPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAdjustPopover]);

  // Keyboard accessibility
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
        handleFitToView();
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

  // --- Image Navigation Handlers ---
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

  const handleFitToView = () => {
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

  // --- Image Orientation Handlers ---
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

  // --- Visualization Adjustments Handlers ---
  const handleResetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(0);
  };

  // --- Mouse & Pointer Events for Panning ---
  const handlePointerDown = (e) => {
    if (e.target.closest("[data-split-handle]")) return;
    // Allow panning if zoom > 1 or pan tool is active
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
      // Clamped boundary proportional to zoom
      const maxPan = 190 * zoom;
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

  // Double-click to zoom
  const handleDoubleClick = (e) => {
    if (isDraggingSplit) return;
    if (zoom === 1) {
      setZoom(1.85);
    } else {
      handleFitToView();
    }
  };

  // Smooth mouse wheel zoom
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

  // Touch Support (1-finger pan, 2-finger pinch-to-zoom)
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
      const maxPan = 190 * zoom;
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

  // High-performance CSS transform and filter string
  const imageTransformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${
      flipH ? -1 : 1
    }) scaleY(${flipV ? -1 : 1})`,
    transition: isDragging ? "none" : "transform 150ms ease-out",
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)${
      sharpness > 0 ? " url(#retina-sharpen-filter)" : ""
    }`
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50 bg-slate-950 flex flex-col p-0" : "w-full"
      }`}
    >
      {/* SVG Convolution Filter for Edge Sharpening */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter id="retina-sharpen-filter">
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
          COMPACT CLINICAL IMAGE TOOLBAR
          Header inside the Fundus Image section
         ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs gap-y-1.5 gap-x-2 min-h-[44px]">
        {/* Left: Fundus Image Title + Eye Metadata */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="font-semibold text-slate-800 flex items-center gap-1 text-xs sm:text-sm">
            <span>Fundus Image</span>
            <span className="text-xs text-slate-400 font-normal">({eyeLabel})</span>
          </div>

          {/* Visualization Adjusted Tag */}
          {hasAdjustments && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Adjusted
            </span>
          )}
        </div>

        {/* Right: Compact Professional Toolbar */}
        <div className="flex items-center gap-1 relative flex-wrap sm:flex-nowrap">
          {/* GROUP 1: IMAGE NAVIGATION */}
          <div className="flex items-center gap-0.5">
            {/* Zoom In */}
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Zoom In (+ / Wheel Up)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Zoom Out (- / Wheel Down)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Fit to View */}
            <button
              type="button"
              onClick={handleFitToView}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Fit Image (0)"
              aria-label="Fit Image"
            >
              <Scan className="w-4 h-4" />
            </button>

            {/* 1:1 Actual Size */}
            <button
              type="button"
              onClick={handleActualSize}
              className={`px-2 py-1 rounded-md text-xs font-semibold min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                zoom === 1 && pan.x === 0 && pan.y === 0
                  ? "text-blue-700 bg-blue-50 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Actual Size (1:1)"
              aria-label="Actual Size 1:1"
            >
              1:1
            </button>

            {/* Pan Toggle */}
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

          {/* GROUP 2: VISUALIZATION ADJUSTMENTS (POPOVER) */}
          <div className="relative">
            <button
              type="button"
              data-adjust-trigger
              onClick={() => setShowAdjustPopover((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-md min-h-[32px] sm:min-h-[34px] flex items-center gap-1.5 transition-colors text-xs font-medium ${
                showAdjustPopover || hasAdjustments
                  ? "bg-blue-100 text-blue-800 font-semibold"
                  : "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Adjust Visualization"
              aria-label="Adjust Visualization"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Adjust</span>
              {hasAdjustments && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
              )}
            </button>

            {/* Adjustment Popover */}
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
                    <div className="text-[11px] text-slate-400">
                      Display only • Original protected
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

                {/* Brightness Slider */}
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

                {/* Contrast Slider */}
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

                {/* Saturation Slider */}
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

                {/* Sharpness Slider */}
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

          {/* GROUP 3: IMAGE ORIENTATION */}
          <div className="flex items-center gap-0.5">
            {/* Rotate Left 90° */}
            <button
              type="button"
              onClick={handleRotateLeft}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Rotate Left 90°"
              aria-label="Rotate Left 90°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Rotate Right 90° */}
            <button
              type="button"
              onClick={handleRotateRight}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Rotate Right 90°"
              aria-label="Rotate Right 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Flip Horizontal */}
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

            {/* Flip Vertical */}
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

          {/* GROUP 4: SECONDARY CLINICAL TOOLS (Grid, Crosshair, Markers, Compare) */}
          <div className="flex items-center gap-0.5">
            {/* Grid / Ruler */}
            <button
              type="button"
              onClick={() => setShowGrid((g) => !g)}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                showGrid
                  ? "bg-blue-100 text-blue-800"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Toggle Grid / Calibrated Ruler"
              aria-label="Toggle Grid / Calibrated Ruler"
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Crosshair */}
            <button
              type="button"
              onClick={() => setShowCrosshair((c) => !c)}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                showCrosshair
                  ? "bg-blue-100 text-blue-800"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Toggle Center Crosshair"
              aria-label="Toggle Center Crosshair"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Evidence Marker Toggle */}
            <button
              type="button"
              onClick={() => setShowEvidenceMarkers((m) => !m)}
              className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                showEvidenceMarkers
                  ? "bg-amber-100 text-amber-800"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Toggle Lesion Evidence Markers"
              aria-label="Toggle Lesion Evidence Markers"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Before / After Enhanced Comparison */}
            {enhancedImg && (
              <button
                type="button"
                onClick={() => setIsCompareActive((prev) => !prev)}
                className={`p-1.5 rounded-md min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors ${
                  isCompareActive
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
                title="Before / After: Compare Original ↔ Enhanced"
                aria-label="Compare Original and Enhanced images"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-px h-4 bg-slate-200 mx-0.5 hidden xs:block" />

          {/* GROUP 5: RESET VIEW & FULLSCREEN */}
          <div className="flex items-center gap-0.5">
            {/* Reset View */}
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 min-w-[32px] min-h-[32px] sm:min-w-[34px] sm:min-h-[34px] flex items-center justify-center transition-colors"
              title="Reset View (Zoom, Pan, Rotation, Flip)"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
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
          MAIN CLINICAL CANVAS VIEWPORT
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
        className={`relative bg-slate-950 flex items-center justify-center overflow-hidden transition-all touch-none ${
          isFullscreen
            ? "flex-1 w-full h-full p-4"
            : "h-[300px] xs:h-[340px] sm:h-[390px] md:h-[430px] lg:h-[450px] 2xl:h-[490px]"
        } ${
          zoom > 1 || panToolActive
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        }`}
      >
        {/* Fullscreen Close Button */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 bg-slate-800/95 hover:bg-slate-700 text-white px-3.5 py-2 text-xs rounded-md font-medium flex items-center gap-1.5 shadow-lg border border-slate-700 min-h-[38px]"
          >
            <X className="w-4 h-4" />
            <span>Close Fullscreen</span>
          </button>
        )}

        {/* Enhanced Image / Compare Banner */}
        {isCompareActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-md text-center text-xs text-slate-200 z-20 backdrop-blur-xs flex items-center gap-2 shadow-md">
            <span className="text-slate-300">Original</span>
            <span className="text-emerald-400 font-bold">↔</span>
            <span className="text-emerald-400 font-medium">Enhanced</span>
            <span className="text-[11px] text-slate-400">({compareSplit}% split)</span>
            <span className="mx-1 text-slate-500">•</span>
            <span className="text-[11px] text-slate-400 italic">Visualization aid</span>
          </div>
        )}

        {/* Circular Fundus Aperture with Transforms & Filters */}
        <div
          ref={splitRef}
          className="relative w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 2xl:w-[420px] 2xl:h-[420px] max-w-[calc(100vw-3.5rem)] max-h-[calc(100vw-3.5rem)] rounded-full overflow-hidden bg-black shadow-2xl transition-transform duration-75"
          style={imageTransformStyle}
        >
          {/* STANDARD VIEW (When Compare is OFF) */}
          {!isCompareActive ? (
            <img
              src={originalImg}
              alt="Retinal Fundus"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          ) : (
            /* DUAL COMPARISON VIEW (When Compare is ON) */
            <div className="relative w-full h-full">
              {/* Right Side / Background: Enhanced Image */}
              <img
                src={enhancedImg}
                alt="Enhanced Fundus"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />

              {/* Left Side: Original Image (Clipped at compareSplit%) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - compareSplit}% 0 0)` }}
              >
                <img
                  src={originalImg}
                  alt="Original Fundus"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              </div>

              {/* Interactive Split Divider Handle */}
              <div
                data-split-handle
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                  if (e.currentTarget.setPointerCapture) {
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                  }
                }}
                className="absolute top-0 bottom-0 z-30 w-1 bg-white cursor-ew-resize flex items-center justify-center -translate-x-1/2 shadow-lg"
                style={{ left: `${compareSplit}%` }}
              >
                <div className="w-5 h-5 bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center text-[10px] font-bold border border-slate-300">
                  ↔
                </div>
              </div>
            </div>
          )}

          {/* Secondary Overlay: Evidence Markers */}
          {showEvidenceMarkers && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Hard Exudates marker */}
              <div className="absolute top-[42%] left-[56%] -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-400 border-dashed bg-amber-400/20 flex items-center justify-center animate-pulse">
                <span className="text-[9px] font-bold text-amber-200 bg-black/80 px-1 py-0.5 rounded shadow">
                  EX
                </span>
              </div>
              {/* Microaneurysm marker */}
              <div className="absolute top-[36%] left-[62%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-rose-200 bg-black/80 px-1 py-0.5 rounded shadow">
                  MA
                </span>
              </div>
              {/* Blot Hemorrhage marker */}
              <div className="absolute top-[52%] left-[40%] -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-red-500 bg-red-500/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-red-200 bg-black/80 px-1 py-0.5 rounded shadow">
                  HE
                </span>
              </div>
            </div>
          )}

          {/* Secondary Overlay: Grid / Calibrated Ruler */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Concentric Disc Diameter calibration rings */}
              <div className="absolute inset-4 rounded-full border border-blue-400/30 border-dashed" />
              <div className="absolute inset-12 rounded-full border border-blue-400/35" />
              <div className="absolute inset-24 rounded-full border border-blue-400/40 border-dashed" />
              <div className="absolute inset-36 rounded-full border border-blue-400/45" />

              {/* Subdued Axis Lines */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-blue-400/30" />
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-blue-400/30" />

              {/* Optic Disc Diameter Legend */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 px-2 py-0.5 rounded text-[9px] text-blue-300 font-mono tracking-tight">
                Calibrated 1.5mm / 1 DD Intervals
              </div>
            </div>
          )}

          {/* Secondary Overlay: Reticle Crosshair */}
          {showCrosshair && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-full h-px bg-rose-500/60 shadow-xs" />
              <div className="h-full w-px bg-rose-500/60 shadow-xs absolute" />
              <div className="w-6 h-6 rounded-full border border-rose-500/80 absolute" />
              <div className="w-2 h-2 rounded-full bg-rose-500/80 absolute" />
            </div>
          )}
        </div>

        {/* Bottom Left Canvas Info Overlay: Zoom %, Adjustments, Orientation */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-slate-300 bg-slate-900/85 px-3 py-1.5 rounded-md border border-slate-800 backdrop-blur-xs pointer-events-none">
          <span className="font-semibold text-white">{Math.round(zoom * 100)}%</span>
          {hasAdjustments && (
            <span className="text-amber-400 font-mono text-[11px]">
              B:{brightness}% C:{contrast}% S:{saturation}%
              {sharpness > 0 ? ` +${sharpness}sh` : ""}
            </span>
          )}
          {hasOrientation && (
            <span className="text-blue-400 font-mono text-[11px]">
              {rotation > 0 ? `${rotation}° ` : ""}
              {flipH ? "FH " : ""}
              {flipV ? "FV" : ""}
            </span>
          )}
          {panToolActive && (
            <span className="text-emerald-400 font-medium">Pan Active</span>
          )}
        </div>

        {/* Bottom Right Hints */}
        <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-slate-900/85 px-3 py-1.5 rounded-md border border-slate-800 backdrop-blur-xs pointer-events-none hidden sm:flex items-center gap-2">
          <span>Scroll to zoom</span>
          <span>•</span>
          <span>Drag to pan</span>
          <span>•</span>
          <span>2× click toggle</span>
        </div>
      </div>

      {/* =========================================================================
          UNDER IMAGE: IMAGE QUALITY & SMALL METADATA
         ========================================================================= */}
      <div className="px-3 sm:px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700">Image Quality:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
              qualityStatus === "Good"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : qualityStatus === "Borderline"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : qualityStatus === "Ungradable"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200"
            }`}
          >
            {qualityStatus.toUpperCase()}
          </span>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <span className="text-[11px] text-slate-500 font-medium">
            {eyeLabel}
          </span>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <span className="text-[11px] text-slate-500">
            {patient?.cameraModel || session?.patient?.cameraModel || "Camera not provided"}
          </span>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <span className="text-[11px] text-slate-400 italic">
            Visualization only
          </span>
        </div>

        <div className="text-[10px] sm:text-[11px] text-slate-400">
          Capture field and retinal centering not provided
        </div>
      </div>
    </div>
  );
}
