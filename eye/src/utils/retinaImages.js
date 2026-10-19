/**
 * Retina Image Synthesis & Visualization Helpers
 * Generates realistic medical fundus representations, green-channel CLAHE enhancements,
 * and Grad-CAM attention heatmaps for presentation demo.
 */

// Draw procedural realistic retinal fundus on an offscreen canvas and return high-resolution data URL
export function generateFundusCanvasDataUrl(presetKey = "MODERATE_NPDR", width = 1200, height = 1200, eye = "OD") {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Scale virtual 600x600 coordinate system to target high resolution
  const scale = width / 600;
  ctx.scale(scale, scale);

  const virtualW = 600;
  const virtualH = 600;
  const cx = virtualW / 2;
  const cy = virtualH / 2;
  const radius = virtualW * 0.46;

  // Background circular aperture (fundus camera mask)
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, virtualW, virtualH);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // For Left Eye (OS), anatomically mirror horizontally so optic disc is nasal (right) and macula is temporal (left)
  if (eye === "OS") {
    ctx.translate(virtualW, 0);
    ctx.scale(-1, 1);
  }

  // Retinal base orange-red gradient
  let baseGrad;
  if (presetKey === "UNGRADABLE_BLURRED") {
    baseGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    baseGrad.addColorStop(0, "#8a4025");
    baseGrad.addColorStop(0.5, "#4e2114");
    baseGrad.addColorStop(1, "#1c0b05");
  } else {
    baseGrad = ctx.createRadialGradient(cx + 40, cy, 30, cx, cy, radius);
    baseGrad.addColorStop(0, "#d85a2b");
    baseGrad.addColorStop(0.4, "#b93f1d");
    baseGrad.addColorStop(0.85, "#82210b");
    baseGrad.addColorStop(1, "#360b02");
  }
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // Subtle choroidal background texture
  for (let i = 0; i < 400; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.95;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(220, 80, 30, 0.08)" : "rgba(120, 20, 5, 0.08)";
    ctx.beginPath();
    ctx.arc(px, py, 2 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Optic Disc (typically nasal, around 32% x, 50% y)
  const odX = cx - radius * 0.42;
  const odY = cy;
  const odR = radius * 0.16;

  // Optic disc glow
  const odGrad = ctx.createRadialGradient(odX, odY, odR * 0.2, odX, odY, odR);
  odGrad.addColorStop(0, "#ffefa8");
  odGrad.addColorStop(0.6, "#f8be76");
  odGrad.addColorStop(0.95, "#e37f3b");
  odGrad.addColorStop(1, "rgba(210, 80, 30, 0)");
  ctx.fillStyle = odGrad;
  ctx.beginPath();
  ctx.arc(odX, odY, odR, 0, Math.PI * 2);
  ctx.fill();

  // Physiological cup
  ctx.fillStyle = "#fff8dc";
  ctx.beginPath();
  ctx.ellipse(odX + 2, odY, odR * 0.38, odR * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Macula / Fovea (temporal, around 62% x, 51% y)
  const macX = cx + radius * 0.28;
  const macY = cy + radius * 0.03;
  const macR = radius * 0.22;

  const macGrad = ctx.createRadialGradient(macX, macY, 3, macX, macY, macR);
  macGrad.addColorStop(0, "#4a1205");
  macGrad.addColorStop(0.4, "#7a220c");
  macGrad.addColorStop(1, "rgba(185, 63, 29, 0)");
  ctx.fillStyle = macGrad;
  ctx.beginPath();
  ctx.arc(macX, macY, macR, 0, Math.PI * 2);
  ctx.fill();

  // Foveal reflex pin-point
  if (presetKey !== "UNGRADABLE_BLURRED") {
    ctx.fillStyle = "rgba(255, 230, 180, 0.45)";
    ctx.beginPath();
    ctx.arc(macX, macY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Major Retinal Vessels (Arterioles and Venules radiating from Optic Disc)
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawVesselTree = (isVenule = false) => {
    ctx.strokeStyle = isVenule ? "rgba(90, 10, 5, 0.85)" : "rgba(165, 30, 10, 0.82)";
    ctx.lineWidth = isVenule ? 6 : 4;

    // Superior temporal arcade
    ctx.beginPath();
    ctx.moveTo(odX, odY);
    ctx.bezierCurveTo(odX + 40, odY - 100, macX - 40, odY - 120, macX + 70, odY - 90);
    ctx.bezierCurveTo(macX + 120, odY - 70, cx + radius * 0.7, odY - 40, cx + radius * 0.8, odY - 20);
    ctx.stroke();

    // Superior nasal branch
    ctx.beginPath();
    ctx.moveTo(odX, odY);
    ctx.bezierCurveTo(odX - 40, odY - 80, odX - 70, odY - 110, odX - 100, odY - 130);
    ctx.stroke();

    // Inferior temporal arcade
    ctx.lineWidth = isVenule ? 5.5 : 3.8;
    ctx.beginPath();
    ctx.moveTo(odX, odY);
    ctx.bezierCurveTo(odX + 40, odY + 95, macX - 30, odY + 115, macX + 65, odY + 95);
    ctx.bezierCurveTo(macX + 115, odY + 80, cx + radius * 0.7, odY + 50, cx + radius * 0.8, odY + 25);
    ctx.stroke();

    // Inferior nasal branch
    ctx.beginPath();
    ctx.moveTo(odX, odY);
    ctx.bezierCurveTo(odX - 40, odY + 75, odX - 65, odY + 105, odX - 95, odY + 125);
    ctx.stroke();

    // Small tertiary branches
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(macX, odY - 110);
    ctx.lineTo(macX + 25, odY - 135);
    ctx.moveTo(macX + 45, odY - 100);
    ctx.lineTo(macX + 60, odY - 125);
    ctx.moveTo(macX, odY + 105);
    ctx.lineTo(macX + 30, odY + 130);
    ctx.stroke();
  };

  drawVesselTree(true);
  drawVesselTree(false);

  // Lesion drawing for Moderate / Severe NPDR
  if (presetKey === "MODERATE_NPDR" || presetKey === "SEVERE_NPDR") {
    // Microaneurysms (tiny round dark-red dots)
    ctx.fillStyle = "#580000";
    const maList = presetKey === "SEVERE_NPDR"
      ? [
          [macX - 40, macY - 30], [macX - 25, macY + 25], [macX + 35, macY - 20],
          [macX + 50, macY + 35], [odX + 80, odY - 40], [odX + 65, odY + 50],
          [macX - 70, macY - 60], [macX + 80, macY - 60], [macX + 70, macY + 70],
          [odX + 110, odY - 80], [odX + 90, odY + 90], [macX - 50, macY + 55]
        ]
      : [
          [macX - 35, macY - 25], [macX + 40, macY - 15], [macX + 30, macY + 30],
          [odX + 85, odY - 35], [macX - 20, macY + 40], [macX + 55, macY - 45]
        ];

    maList.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Blot & Dot Hemorrhages (irregular dark red patches)
    const hemList = presetKey === "SEVERE_NPDR"
      ? [
          [macX - 60, macY - 45, 7, 5], [macX + 45, macY - 50, 9, 6],
          [macX + 65, macY + 40, 8, 7], [macX - 40, macY + 65, 10, 6],
          [odX + 70, odY - 70, 8, 5], [odX + 80, odY + 65, 9, 6],
          [macX + 110, macY - 20, 11, 8], [odX - 30, odY - 50, 7, 6]
        ]
      : [
          [macX - 50, macY - 40, 6, 4], [macX + 48, macY - 45, 7, 5],
          [macX + 40, macY + 45, 6, 5]
        ];

    hemList.forEach(([x, y, rx, ry]) => {
      ctx.fillStyle = "#490202";
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hard Exudates (bright creamy yellow/white discrete deposits)
    ctx.fillStyle = "#fff8a6";
    const exudateClusters = [
      { cx: macX + 25, cy: macY - 30, count: 18, spread: 22 },
      { cx: macX + 35, cy: macY + 20, count: 14, spread: 18 }
    ];

    if (presetKey === "SEVERE_NPDR") {
      exudateClusters.push({ cx: macX - 55, cy: macY - 50, count: 12, spread: 20 });
    }

    exudateClusters.forEach(({ cx: exCx, cy: exCy, count, spread }) => {
      for (let k = 0; k < count; k++) {
        const offX = exCx + (Math.sin(k * 1.5) * spread * 0.7);
        const offY = exCy + (Math.cos(k * 1.3) * spread * 0.7);
        ctx.beginPath();
        ctx.arc(offX, offY, 1.8 + Math.random() * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Cotton Wool Spots for Severe NPDR (fluffy cloudy white spots)
    if (presetKey === "SEVERE_NPDR") {
      ctx.fillStyle = "rgba(255, 255, 245, 0.45)";
      const cws = [[macX - 30, macY - 75, 14], [macX + 50, macY - 80, 16], [odX + 60, odY + 70, 15]];
      cws.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // If UNGRADABLE_BLURRED, add heavy cataract haze and motion blur
  if (presetKey === "UNGRADABLE_BLURRED") {
    // Dense yellowish-brown cataract opacity
    const haze = ctx.createRadialGradient(cx, cy, 30, cx, cy, radius);
    haze.addColorStop(0, "rgba(80, 50, 20, 0.65)");
    haze.addColorStop(0.6, "rgba(110, 70, 25, 0.78)");
    haze.addColorStop(1, "rgba(30, 15, 5, 0.9)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, virtualW, virtualH);

    // Defocus smudge
    ctx.fillStyle = "rgba(180, 140, 90, 0.25)";
    ctx.beginPath();
    ctx.ellipse(cx - 30, cy + 20, radius * 0.7, radius * 0.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Dark circular border mask outline
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.98);
}

// Generate Green-channel CLAHE enhanced image for microvascular contrast (High Resolution)
export function generateEnhancedCanvasDataUrl(presetKey = "MODERATE_NPDR", width = 1200, height = 1200, eye = "OD") {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Scale virtual 600x600 coordinate system to target high resolution
  const scale = width / 600;
  ctx.scale(scale, scale);

  const virtualW = 600;
  const virtualH = 600;
  const cx = virtualW / 2;
  const cy = virtualH / 2;
  const radius = virtualW * 0.46;

  ctx.fillStyle = "#050807";
  ctx.fillRect(0, 0, virtualW, virtualH);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (eye === "OS") {
    ctx.translate(virtualW, 0);
    ctx.scale(-1, 1);
  }

  // Green-channel monochrome background (emerald/teal tint used clinically)
  const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius);
  bgGrad.addColorStop(0, "#4ade80");
  bgGrad.addColorStop(0.5, "#22c55e");
  bgGrad.addColorStop(0.85, "#15803d");
  bgGrad.addColorStop(1, "#052e16");
  ctx.fillStyle = bgGrad;
  ctx.fill();

  const odX = cx - radius * 0.42;
  const odY = cy;
  const odR = radius * 0.16;

  // Optic disc appears bright white-green in green channel
  ctx.fillStyle = "#f0fdf4";
  ctx.beginPath();
  ctx.arc(odX, odY, odR, 0, Math.PI * 2);
  ctx.fill();

  // Inverted dark high-contrast blood vessels
  ctx.strokeStyle = "#022c22";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 5;

  const macX = cx + radius * 0.28;
  const macY = cy + radius * 0.03;

  ctx.beginPath();
  ctx.moveTo(odX, odY);
  ctx.bezierCurveTo(odX + 40, odY - 100, macX - 40, odY - 120, macX + 70, odY - 90);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(odX, odY);
  ctx.bezierCurveTo(odX + 40, odY + 95, macX - 30, odY + 115, macX + 65, odY + 95);
  ctx.stroke();

  // Microaneurysms appear as distinct black punctate dots
  if (presetKey === "MODERATE_NPDR" || presetKey === "SEVERE_NPDR") {
    ctx.fillStyle = "#000000";
    const dots = [
      [macX - 35, macY - 25], [macX + 40, macY - 15], [macX + 30, macY + 30],
      [odX + 85, odY - 35], [macX - 20, macY + 40], [macX + 55, macY - 45]
    ];
    dots.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Exudates show as stark bright white deposits
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.arc(macX + 25 + Math.sin(i) * 16, macY - 30 + Math.cos(i) * 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  return canvas.toDataURL("image/jpeg", 0.92);
}

// Generate Grad-CAM activation heatmap data URL (High Resolution)
export function generateGradCamCanvasDataUrl(presetKey = "MODERATE_NPDR", width = 1200, height = 1200, eye = "OD") {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Scale virtual 600x600 coordinate system to target high resolution
  const scale = width / 600;
  ctx.scale(scale, scale);

  const virtualW = 600;
  const virtualH = 600;
  const cx = virtualW / 2;
  const cy = virtualH / 2;
  const radius = virtualW * 0.46;

  ctx.clearRect(0, 0, virtualW, virtualH);

  if (presetKey === "UNGRADABLE_BLURRED") {
    return canvas.toDataURL("image/png");
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  if (eye === "OS") {
    ctx.translate(virtualW, 0);
    ctx.scale(-1, 1);
  }

  // Baseline cool blue transparent ambient activation
  ctx.fillStyle = "rgba(10, 25, 120, 0.28)";
  ctx.fillRect(0, 0, virtualW, virtualH);

  const macX = cx + radius * 0.28;
  const macY = cy + radius * 0.03;

  if (presetKey === "NORMAL") {
    // Minimal diffuse green/blue
    const normGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius * 0.8);
    normGrad.addColorStop(0, "rgba(20, 180, 120, 0.22)");
    normGrad.addColorStop(1, "rgba(5, 20, 90, 0.05)");
    ctx.fillStyle = normGrad;
    ctx.fill();
  } else {
    // High-intensity jet/turbo heatmap centered on the lesions
    const addHotspot = (hx, hy, r, intensity) => {
      const heat = ctx.createRadialGradient(hx, hy, 2, hx, hy, r);
      heat.addColorStop(0, `rgba(255, 30, 0, ${0.85 * intensity})`);      // Dark Red core
      heat.addColorStop(0.35, `rgba(255, 150, 0, ${0.75 * intensity})`);  // Orange
      heat.addColorStop(0.65, `rgba(255, 230, 0, ${0.60 * intensity})`);  // Yellow
      heat.addColorStop(0.85, `rgba(0, 220, 100, ${0.40 * intensity})`);  // Green
      heat.addColorStop(1, "rgba(0, 50, 200, 0)");                         // Faded Blue
      ctx.fillStyle = heat;
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    if (presetKey === "MODERATE_NPDR") {
      addHotspot(macX + 28, macY - 26, radius * 0.32, 0.95);
      addHotspot(macX - 25, macY + 30, radius * 0.25, 0.82);
      addHotspot(cx - radius * 0.1, cy - radius * 0.15, radius * 0.22, 0.70);
    } else if (presetKey === "SEVERE_NPDR") {
      addHotspot(macX - 30, macY - 60, radius * 0.35, 0.98);
      addHotspot(macX + 50, macY + 45, radius * 0.38, 0.94);
      addHotspot(cx - radius * 0.2, cy + radius * 0.2, radius * 0.32, 0.88);
      addHotspot(cx - radius * 0.15, cy - radius * 0.25, radius * 0.30, 0.86);
    }
  }

  ctx.restore();
  return canvas.toDataURL("image/png");
}

// Generate zoomed-in pathological ROI patch thumbnail (High Resolution)
export function generateRoiThumbnail(roiId = "ROI-1", width = 800, height = 800) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Scale virtual 160x160 coordinate system to target high resolution
  const scale = width / 160;
  ctx.scale(scale, scale);

  const virtualW = 160;
  const virtualH = 160;
  const cx = virtualW / 2;
  const cy = virtualH / 2;

  // Retinal orange-red base
  const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, virtualW * 0.7);
  bgGrad.addColorStop(0, "#c44b20");
  bgGrad.addColorStop(0.7, "#8e270e");
  bgGrad.addColorStop(1, "#4d1004");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, virtualW, virtualH);

  // Optical grid overlay
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 20; i < virtualW; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, virtualH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(virtualW, i);
    ctx.stroke();
  }

  // Draw specific pathology based on ROI type
  if (roiId.includes("Exudate") || roiId === "ROI-1") {
    // Microvascular capillary crossing
    ctx.strokeStyle = "rgba(100, 15, 5, 0.85)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(10, 30);
    ctx.bezierCurveTo(60, 45, 110, 80, 150, 130);
    ctx.stroke();

    // Bright yellow hard exudates cluster
    ctx.fillStyle = "#fffca8";
    const seeds = [
      [cx - 20, cy - 10, 4], [cx - 10, cy - 25, 3.5], [cx + 5, cy - 18, 5],
      [cx + 18, cy - 5, 4.5], [cx + 25, cy + 12, 3.8], [cx + 8, cy + 22, 4],
      [cx - 12, cy + 15, 3], [cx, cy, 5.5], [cx - 28, cy + 5, 3.2]
    ];
    seeds.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Measurement scale tick
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 36, cy - 32, 72, 64);
  } else if (roiId.includes("Microaneurysm") || roiId === "ROI-2") {
    // Fine capillary vessel
    ctx.strokeStyle = "rgba(140, 20, 10, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(20, 140);
    ctx.bezierCurveTo(50, 90, 100, 70, 140, 20);
    ctx.stroke();

    // Microaneurysm saccular outpouches
    ctx.fillStyle = "#3b0202";
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 5, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + 28, cy - 22, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Fluorescein leakage simulation ring
    ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 5, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (roiId.includes("Hemorrhage") || roiId === "ROI-3" || roiId === "ROI-C") {
    // Deep dark intraretinal blot hemorrhage
    ctx.fillStyle = "#2d0202";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 28, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4a0505";
    ctx.beginPath();
    ctx.ellipse(cx + 15, cy - 10, 12, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Caliper marker
    ctx.strokeStyle = "rgba(244, 63, 94, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy + 24);
    ctx.lineTo(cx + 32, cy + 24);
    ctx.stroke();
  } else if (roiId.includes("Venous") || roiId === "ROI-A") {
    // Tortuous venous beading with caliber changes
    ctx.strokeStyle = "#380606";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.bezierCurveTo(cx - 20, 60, cx + 20, 100, 130, 140);
    ctx.stroke();

    // Focal constriction & dilatation (beading)
    ctx.fillStyle = "#4c0909";
    ctx.beginPath();
    ctx.arc(cx - 5, 65, 10, 0, Math.PI * 2);
    ctx.arc(cx + 10, 95, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (roiId.includes("Cotton") || roiId === "ROI-B") {
    // Fluffy cloud of axoplasmic stasis (CWS)
    const cwsGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 32);
    cwsGrad.addColorStop(0, "rgba(255, 255, 250, 0.9)");
    cwsGrad.addColorStop(0.5, "rgba(250, 250, 240, 0.6)");
    cwsGrad.addColorStop(1, "rgba(200, 120, 70, 0)");
    ctx.fillStyle = cwsGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Healthy retinal pattern (FAZ or disc)
    ctx.fillStyle = "#ffeedb";
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff8dc";
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crosshair in corner
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(18, 10);
  ctx.moveTo(10, 10);
  ctx.lineTo(10, 18);
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.98);
}
