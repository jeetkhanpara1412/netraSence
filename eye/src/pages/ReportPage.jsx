import React, { useState, useEffect } from "react";
import { reportService } from "../services/report.service.js";
import { generateRoiThumbnail } from "../utils/retinaImages.js";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  FileCheck2,
  ShieldCheck,
  UserCheck,
  Info,
  X,
  Eye,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2
} from "lucide-react";

export default function ReportPage({ onNavigateToDashboard }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showExportGuide, setShowExportGuide] = useState(false);
  const [inspectingImage, setInspectingImage] = useState(null);
  const [inspectZoom, setInspectZoom] = useState(1);
  const [showInspectGrid, setShowInspectGrid] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReport();
      setReport(data);
    } catch (err) {
      console.error("Error loading screening report:", err);
      setReportError(err.message || "The screening report could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report || isExporting) return;
    try {
      setIsExporting(true);
      setShowExportGuide(true);
      await reportService.exportToPdf(report, {
        reportElementId: "printable-clinical-report",
        onComplete: () => {
          setIsExporting(false);
        },
        onError: () => {
          setIsExporting(false);
        }
      });
    } catch (err) {
      console.error("Error exporting report to PDF:", err);
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    reportService.printReport(report, { reportElementId: "printable-clinical-report" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-600 text-sm font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
          <span>Loading clinical screening report...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-5 bg-white border border-amber-200 rounded-lg text-center">
        <h1 className="text-base font-bold text-slate-900">Report unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">{reportError || "No screening report is available."}</p>
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded hover:bg-blue-800"
        >
          Return to screening
        </button>
      </div>
    );
  }

  const { screening, reportId, generatedAt, teleHealthCenter } = report;
  const {
    patient,
    quality,
    aiResult,
    modelAlternatives,
    selfValidation,
    explainability,
    lesions,
    structures,
    doctorReview,
    images
  } = screening;
  const isDemoCase = screening?.caseType === "DEMO_CASE";
  const withDemoFallback = (value, fallback) => (
    value !== null && value !== undefined && value !== ""
      ? value
      : isDemoCase ? fallback : "Not assessed"
  );
  const probabilities = aiResult?.probabilities || (isDemoCase ? [
    { level: 0, label: "Level 0: No DR", probability: 2.1 },
    { level: 1, label: "Level 1: Mild NPDR", probability: 6.8 },
    { level: 2, label: "Level 2: Moderate NPDR", probability: 88.4 },
    { level: 3, label: "Level 3: Severe NPDR", probability: 2.3 },
    { level: 4, label: "Level 4: Proliferative DR", probability: 0.4 }
  ] : []);
  const lesionStatus = (finding) => {
    if (finding?.detected === true) return "Detected";
    if (finding?.detected === false) return "Not detected";
    return "Not assessed";
  };

  // Only demo cases may use generated illustration thumbnails.
  const evidenceImage =
    images?.evidence ||
    (isDemoCase && screening?.evidenceGallery?.[0]
      ? generateRoiThumbnail(screening.evidenceGallery[0].id, 800, 800)
      : null);

  const isReferable = aiResult?.drLevel == null ? null : aiResult.drLevel >= 2;

  return (
    <div className="min-h-screen bg-slate-100/80 py-4 sm:py-6 px-2 sm:px-4 text-slate-900 print:bg-white print:p-0 print:py-0 print:m-0 print:min-h-0">
      {/* Top Action Bar (hidden in print) */}
      <div className="max-w-[210mm] mx-auto mb-4 no-print flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-300 rounded-lg p-3 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Dashboard</span>
          </button>
          <div className="hidden sm:block text-xs text-slate-500">
            A4 Print Report • Exactly 2 Pages (Front & Back)
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            id="download-pdf-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-500 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Export report into a formatted 2-page A4 PDF file"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                <span>Preparing PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            id="print-report-button"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Direct print"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* PDF Export Helper Notice (visible in screen, hidden in print) */}
      {showExportGuide && (
        <div className="max-w-[210mm] mx-auto mb-4 no-print bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-3 text-xs flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                <span>Formatted 2-Page A4 PDF Export Utility</span>
                <span className="text-[10px] bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded font-mono font-bold">
                  {reportService.generatePdfFilename(report)}.pdf
                </span>
              </div>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                In the browser print window, verify that Destination is set to <strong>"Save as PDF"</strong>, Paper size to <strong>A4</strong>, and ensure <strong>"Background graphics"</strong> is checked for high-resolution retina scans and clinical grading colors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExportGuide(false)}
            className="text-blue-500 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Report Pages Container */}
      <div
        id="printable-clinical-report"
        className="max-w-[210mm] mx-auto space-y-6 print:space-y-0 print:max-w-none print:m-0 print:p-0"
      >
        {/* =========================================================================
            PAGE 1: CLINICAL SCREENING SUMMARY (FRONT)
           ========================================================================= */}
        <article
          id="clinical-report-page-1"
          className="a4-page a4-page-1 bg-white border border-slate-300 rounded-sm shadow-md p-6 sm:p-8 md:p-9 text-slate-900 flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {isDemoCase && (
            <div className="mb-3 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-amber-950 bg-amber-100 border border-amber-300 rounded">
              Demo data only — not a real patient record or clinical result
            </div>
          )}
          <div className="space-y-3.5">
            {/* Page 1 Header */}
            <header className="border-b-2 border-slate-900 pb-3">
              <div className="flex flex-row items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold tracking-wider uppercase text-blue-900">
                    {teleHealthCenter?.facility || (isDemoCase ? "Maharashtra Tele-Ophthalmology Network" : "Facility not provided")}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                    Nodal Hospital: {teleHealthCenter?.nodalHospital?.split(",")[0] || (isDemoCase ? "Sasoon General Hospital, Pune" : "Not provided")}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight mt-1">
                    Diabetic Retinopathy Screening Report
                  </h1>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block bg-slate-100 border border-slate-300 px-2.5 py-1 rounded text-right">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Report ID</div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-slate-950">{reportId}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Screening Date: <span className="text-slate-800 font-semibold">{patient.examDate || generatedAt}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Patient & Screening Summary (Visually Prominent Classification & Doctor Decision) */}
            <section aria-labelledby="p1-patient-summary" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 id="p1-patient-summary" className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  Patient & Screening Summary
                </h2>
                <div className="text-[10px] text-slate-500 font-medium">
                  Centre: {patient.phcCenter || (isDemoCase ? "Shirur Rural Primary Health Centre" : "Not provided")}
                </div>
              </div>

              <div className="border border-slate-300 rounded bg-slate-50/70 p-3 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 print:gap-2 text-xs">
                {/* Patient Information */}
                <div className="space-y-0.5 border-r border-slate-200 pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Patient Name</span>
                  <strong className="text-slate-950 text-xs sm:text-sm block truncate">{patient.name}</strong>
                  <div className="text-[11px] text-slate-600 font-mono">ID: {patient.id}</div>
                  <div className="text-[11px] text-slate-600">Age/Sex: {patient.age ? `${patient.age} Y` : "Age not provided"} / {patient.gender || "Gender not provided"}</div>
                </div>

                {/* Eye & Examination */}
                <div className="space-y-0.5 border-r border-slate-200 pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 block">Eye Screened</span>
                  <div className="text-xs sm:text-sm font-bold text-blue-900">{patient.eye || "Not provided"}</div>
                  <div className="text-[11px] text-slate-600">Camera: {patient.cameraModel?.split("(")[0]?.trim() || (isDemoCase ? "Forus 3nethra Classic HD" : "Not provided")}</div>
                  <div className="text-[11px] text-slate-600 truncate">Operator: {patient.operator?.split("(")[0]?.trim() || (isDemoCase ? "Ophthalmic Asst." : "Not provided")}</div>
                </div>

                {/* AI DR Classification (Visually Prominent) */}
                <div className="space-y-0.5 border-r border-slate-200 pr-2 bg-white p-2 rounded border border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-blue-900 block">
                    AI DR Classification
                  </span>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-950">
                    {aiResult?.drLevel != null ? `Level ${aiResult.drLevel}` : (isDemoCase ? "Level 2" : "Not assessed")}
                  </div>
                  <div className={`text-[11px] font-bold ${isReferable == null ? "text-slate-500" : isReferable ? "text-rose-800" : "text-emerald-800"}`}>
                    {aiResult?.severityLabel?.split("(")[0]?.trim() || (isDemoCase ? "Moderate NPDR" : "Not assessed")}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600">
                    Uncalibrated score: <span className="text-slate-900 font-bold">{aiResult?.confidence != null ? `${aiResult.confidence}%${isDemoCase ? " (demo)" : ""}` : "Not assessed"}</span>
                  </div>
                </div>

                {/* Doctor Decision (Visually Prominent) */}
                <div className="space-y-0.5 bg-white p-2 rounded border border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700 block">
                    Doctor Decision
                  </span>
                  <div className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-blue-900 text-white uppercase tracking-wide">
                    {doctorReview?.decision || (isDemoCase ? "Confirmed" : "Pending review")}
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 mt-1 truncate">
                    {doctorReview?.reviewerName?.split(",")[0] || (isDemoCase ? "Dr. Rajesh Sharma, MD" : "Not provided")}
                  </div>
                  <div className="text-[10px] text-slate-500">Reg: {doctorReview?.registrationNumber || (isDemoCase ? "MCI-48920-MH" : "Not provided")}</div>
                </div>
              </div>
            </section>

            {/* Clinical Retinal Imaging: Balanced 2-Column Clinical Grid (~45% A4 Width per Image) */}
            <section aria-labelledby="p1-imaging-section" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 id="p1-imaging-section" className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    Clinical Retinal Imaging (Fundus Examination)
                  </h2>
                  <span className="text-[9.5px] font-bold text-blue-900 bg-blue-100 border border-blue-200 px-1.5 py-0.2 rounded print:hidden">
                    2-Column Clinical Grid
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Uploaded fundus image • Capture details not provided</span>
              </div>

              {/* Balanced 2-Column Grid: Each column occupies ~45% of A4 width with aspect-square preservation */}
              <div className="grid grid-cols-2 gap-3.5 print:gap-3 items-stretch">
                {/* Column 1: Primary Color Fundus (OD / OS) */}
                <div className="border border-slate-300 rounded-md p-2 bg-slate-50/90 flex flex-col justify-between clinical-image-box shadow-xs print:shadow-none">
                  {/* Card Sub-Header */}
                  <div className="flex items-center justify-between mb-1.5 text-[9.5px]">
                    <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                      <span>1. Primary Color Fundus</span>
                    </span>
                    <span className="font-mono font-bold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {patient?.eye === "OS" ? "Left Eye (OS)" : patient?.eye === "OD" ? "Right Eye (OD)" : "Eye not provided"}
                    </span>
                  </div>

                  {/* Fundus Image Frame: Full-width square viewport occupying ~45% of A4 width */}
                  <div
                    className="w-full aspect-square max-h-[250px] print:max-h-[92mm] bg-[#07080a] rounded overflow-hidden flex items-center justify-center border border-slate-300 relative group cursor-pointer"
                    onClick={() =>
                      setInspectingImage({
                        url: images?.original,
                        title: `Original Fundus Image — ${patient?.eye === "OS" ? "Left Eye (OS)" : patient?.eye === "OD" ? "Right Eye (OD)" : "Eye not provided"}`,
                        modality: "Uploaded source image",
                        desc: "Capture field and retinal centering were not provided.",
                        eye: patient?.eye || "Not provided"
                      })
                    }
                    title="Click for high-resolution diagnostic inspection"
                  >
                    <img
                      src={images?.original}
                      alt={`Original Fundus — ${patient?.eye === "OS" ? "Left Eye (OS)" : patient?.eye === "OD" ? "Right Eye (OD)" : "Eye not provided"}`}
                      className="w-full h-full object-contain select-none"
                      loading="eager"
                      decoding="sync"
                    />

                    {/* Interactive On-Screen Inspect Hover Prompt */}
                    <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                      <ZoomIn className="w-4 h-4" />
                      <span>Click to Inspect (Zoom & Pan)</span>
                    </div>

                    {/* Anatomical Quadrant Orientation Guide */}
                    <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white/90 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-xs">
                      {patient?.eye === "OS" ? "Nasal (Disc) ➔ | ◷ Macula (Temporal)" : patient?.eye === "OD" ? "◷ Macula (Temporal) | ➔ Nasal (Disc)" : "Orientation not provided"}
                    </div>

                    {/* Source image badge */}
                    <div className="absolute top-1.5 right-1.5 bg-blue-950/80 text-blue-200 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-blue-400/20 backdrop-blur-xs">
                      Uploaded image
                    </div>
                  </div>

                  {/* Caption & Technical Spec */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                      Original Fundus — {patient?.eye === "OS" ? "Left Eye (OS)" : patient?.eye === "OD" ? "Right Eye (OD)" : "Eye not provided"}
                    </span>
                    <span className="text-[9.5px] text-slate-600 block leading-tight mt-0.5">
                      Capture modality and field of view not provided
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5">
                      Displayed for report review • Source resolution not provided
                    </span>
                  </div>
                </div>

                {/* Column 2: Enhanced Fundus (Microvascular Contrast) */}
                <div className="border border-slate-300 rounded-md p-2 bg-slate-50/90 flex flex-col justify-between clinical-image-box shadow-xs print:shadow-none">
                  {/* Card Sub-Header */}
                  <div className="flex items-center justify-between mb-1.5 text-[9.5px]">
                    <span className="font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>2. Enhanced Microvascular View</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Green-CLAHE
                    </span>
                  </div>

                  {/* Fundus Image Frame: Full-width square viewport occupying ~45% of A4 width */}
                  <div
                    className="w-full aspect-square max-h-[250px] print:max-h-[92mm] bg-[#040806] rounded overflow-hidden flex items-center justify-center border border-slate-300 relative group cursor-pointer"
                    onClick={() =>
                      setInspectingImage({
                        url: images?.enhanced,
                        title: "Enhanced Microvascular Fundus — Green-Channel CLAHE",
                        modality: "Contrast-Enhanced Equalized Modality",
                        desc: "Green-channel contrast enhancement for visualization; not a lesion detection result.",
                        eye: patient?.eye || "Not provided"
                      })
                    }
                    title="Click for high-resolution diagnostic inspection"
                  >
                    <img
                      src={images?.enhanced}
                      alt="Enhanced Fundus — Visualization Aid"
                      className="w-full h-full object-contain select-none"
                      loading="eager"
                      decoding="sync"
                    />

                    {/* Interactive On-Screen Inspect Hover Prompt */}
                    <div className="no-print absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-[1px]">
                      <ZoomIn className="w-4 h-4" />
                      <span>Click to Inspect (Zoom & Pan)</span>
                    </div>

                    {/* Filter Spec Guide */}
                    <div className="absolute bottom-1.5 left-1.5 bg-emerald-950/80 text-emerald-200 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-400/20 backdrop-blur-xs">
                      Green-channel enhancement
                    </div>

                    {/* Lesion Accentuator Badge */}
                    <div className="absolute top-1.5 right-1.5 bg-emerald-950/80 text-emerald-200 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-400/20 backdrop-blur-xs">
                      Contrast view only
                    </div>
                  </div>

                  {/* Caption & Technical Spec */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                      Enhanced Fundus — Visualization Aid
                    </span>
                    <span className="text-[9.5px] text-slate-600 block leading-tight mt-0.5">
                      Green-channel CLAHE visualization aid
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5">
                      Frame: ~45% A4 Width • Accentuated Retinal Vasculature
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Image Quality Assessment & Retinal Structures (Compact 2-Column Clinical Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2">
              {/* Image Quality Assessment */}
              <section aria-labelledby="p1-quality-heading" className="border border-slate-300 rounded p-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                  <h3 id="p1-quality-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    Image Quality Assessment
                  </h3>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${quality?.status === "Good" ? "text-emerald-800 bg-emerald-100 border-emerald-300" : "text-slate-600 bg-slate-100 border-slate-300"}`}>
                    {quality
                      ? quality.overallScore != null ? `${quality.status} (${quality.overallScore}/100)` : quality.status
                      : (isDemoCase ? "Good (92/100)" : "Not assessed")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Focus</span>
                    <span className="font-semibold text-slate-900">
                      {withDemoFallback(quality?.metrics?.focus?.status, "Optimal")} ({quality?.metrics?.focus?.score ?? (isDemoCase ? 94 : "—")}{quality?.metrics?.focus?.score != null || isDemoCase ? "%" : ""})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Illumination</span>
                    <span className="font-semibold text-slate-900">
                      {withDemoFallback(quality?.metrics?.illumination?.status, "Good")} ({quality?.metrics?.illumination?.score ?? (isDemoCase ? 90 : "—")}{quality?.metrics?.illumination?.score != null || isDemoCase ? "%" : ""})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Field of View</span>
                    <span className="font-semibold text-slate-900">
                      {withDemoFallback(quality?.metrics?.fieldOfView?.status, "Full 45°")} ({quality?.metrics?.fieldOfView?.score ?? (isDemoCase ? 95 : "—")}{quality?.metrics?.fieldOfView?.score != null || isDemoCase ? "%" : ""})
                    </span>
                  </div>
                </div>
              </section>

              {/* Retinal Structures */}
              <section aria-labelledby="p1-structures-heading" className="border border-slate-300 rounded p-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                  <h3 id="p1-structures-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    Retinal Structures
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Anatomical Margins</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Optic Disc</span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {withDemoFallback(structures?.opticDisc?.status, "Sharp margins (C:D 0.35)")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Fovea / Macula</span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {withDemoFallback(structures?.maculaFovea?.status, "Clear FAZ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Blood Vessels</span>
                    <span className="font-semibold text-slate-900 truncate block">
                      {withDemoFallback(structures?.vessels?.status, "Normal caliber")}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Lesion Analysis: Compact Professional Clinical Table */}
            <section aria-labelledby="p1-lesions-heading" className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 id="p1-lesions-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  Lesion Analysis
                </h2>
                <span className="text-[10px] text-slate-500 font-medium">ICDR Pathological Markers</span>
              </div>

              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px] uppercase">
                    <tr>
                      <th className="py-1.5 px-3">Lesion Type</th>
                      <th className="py-1.5 px-2 text-center">Code</th>
                      <th className="py-1.5 px-2.5">Status</th>
                      <th className="py-1.5 px-3">Clinical Severity & Count</th>
                      <th className="py-1.5 px-3">Retinal Region / Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px] bg-white">
                    <tr>
                      <td className="py-1.5 px-3 font-semibold text-slate-950">Microaneurysms</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-600">MA</td>
                      <td className="py-1.5 px-2.5">
                        <span className={`font-bold ${lesions?.microaneurysms?.detected === true ? "text-rose-800" : "text-slate-500"}`}>
                          {lesionStatus(lesions?.microaneurysms)}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {withDemoFallback(lesions?.microaneurysms?.count, "14 isolated points")} ({withDemoFallback(lesions?.microaneurysms?.severity, "Moderate")})
                      </td>
                      <td className="py-1.5 px-3 text-slate-600">
                        {withDemoFallback(lesions?.microaneurysms?.regions?.join(", "), "Superior-temporal arcade, parafoveal")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold text-slate-950">Intraretinal Hemorrhages</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-600">HE</td>
                      <td className="py-1.5 px-2.5">
                        <span className={`font-bold ${lesions?.hemorrhages?.detected === true ? "text-rose-800" : "text-slate-500"}`}>
                          {lesionStatus(lesions?.hemorrhages)}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {withDemoFallback(lesions?.hemorrhages?.count, "7 dot/blot hemorrhages")} ({withDemoFallback(lesions?.hemorrhages?.severity?.split("(")[0]?.trim(), "Moderate")})
                      </td>
                      <td className="py-1.5 px-3 text-slate-600">
                        {withDemoFallback(lesions?.hemorrhages?.regions?.join(", "), "Temporal & Inferior-temporal")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold text-slate-950">Hard Exudates</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-600">EX</td>
                      <td className="py-1.5 px-2.5">
                        <span className={`font-bold ${lesions?.exudates?.detected === true ? "text-amber-800" : "text-slate-500"}`}>
                          {lesionStatus(lesions?.exudates)}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {withDemoFallback(lesions?.exudates?.count, "Clusters with circinate tendency")} ({withDemoFallback(lesions?.exudates?.severity, "Clinically Significant")})
                      </td>
                      <td className="py-1.5 px-3 text-slate-600">
                        {withDemoFallback(lesions?.exudates?.regions?.join(", "), "Parafoveal avascular zone boundary")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold text-slate-950">Neovascularization</td>
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-600">NV</td>
                      <td className="py-1.5 px-2.5">
                        <span className={`font-bold ${lesions?.neovascularization?.detected === true ? "text-rose-800" : "text-slate-500"}`}>
                          {lesionStatus(lesions?.neovascularization)}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {withDemoFallback(lesions?.neovascularization?.count, "None detected (NVD / NVE absent)")}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600">
                        {lesions?.neovascularization?.detected === false
                          ? "No neovascularization detected by configured model"
                          : withDemoFallback(null, "Negative across all 4 quadrants")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Page 1 Footer */}
          <footer className="mt-4 print:mt-2 pt-2.5 print:pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <div>
              Report ID: <span className="font-mono font-semibold text-slate-800">{reportId}</span>
            </div>
            <div className="text-center font-semibold text-slate-700">
              Confidential Clinical Screening Report
            </div>
            <div className="font-bold text-slate-800">
              Page 1 of 2
            </div>
          </footer>
        </article>

        {/* =========================================================================
            PAGE 2: CLINICAL INTERPRETATION & REVIEW (BACK)
           ========================================================================= */}
        <article
          id="clinical-report-page-2"
          className="a4-page a4-page-2 bg-white border border-slate-300 rounded-sm shadow-md p-6 sm:p-8 md:p-9 text-slate-900 flex flex-col justify-between print:border-none print:shadow-none print:p-0 print:m-0"
        >
          <div className="space-y-3">
            {/* Page 2 Running Header */}
            <header className="border-b-2 border-slate-900 pb-2 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  Diabetic Retinopathy Screening Report
                </span>
                <span className="text-sm font-bold text-slate-950">
                  Page 2: Clinical Interpretation & Review
                </span>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                Patient: <strong className="text-slate-950">{patient.name}</strong> ({patient.id}) • Eye: <strong className="text-blue-900">{patient.eye || "Not provided"}</strong>
              </div>
            </header>

            {/* 1. Explainable AI — Grad-CAM Attention & Evidence */}
            <section aria-labelledby="p2-xai-heading" className="border border-slate-300 rounded p-2.5 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <h2 id="p2-xai-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
                  <span>1. Explainable AI — Grad-CAM Attention & Evidence</span>
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                  {selfValidation?.status || (isDemoCase ? "Explanation Consistent" : "Not assessed")}
                  {selfValidation?.alignmentScore != null ? ` (${selfValidation.alignmentScore}% alignment)` : ""}
                </span>
              </div>

              {/* Medium-sized Images (Side-by-Side: 40-48% width each, or 75-90% if alone) */}
              <div className={evidenceImage ? "grid grid-cols-2 gap-3 print:gap-2.5" : "flex justify-center"}>
                {/* Grad-CAM Attention */}
                <div className={`border border-slate-300 rounded p-2 bg-white flex flex-col items-center text-center clinical-image-box ${evidenceImage ? "w-full" : "w-full max-w-[85%]"}`}>
                  <div className="relative w-full aspect-[4/3] max-h-[175px] print:max-h-[160px] bg-[#0a0a0c] rounded-sm overflow-hidden flex items-center justify-center border border-slate-200">
                    <img
                      src={images?.original}
                      alt="Fundus Base"
                      className="w-full h-full object-contain"
                      loading="eager"
                      decoding="sync"
                    />
                    {images?.gradCam && (
                      <img
                        src={images.gradCam}
                        alt="Grad-CAM Saliency Overlay"
                        className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-85"
                        loading="eager"
                        decoding="sync"
                      />
                    )}
                  </div>
                  <div className="mt-1.5 w-full">
                    <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                      Grad-CAM — AI Attention Visualization
                    </span>
                    <span className="text-[9.5px] text-slate-500 block leading-tight mt-0.5">
                      Gradient-Weighted Saliency Map • Activation Overlay
                    </span>
                  </div>
                </div>

                {/* Lesion Evidence / Annotation */}
                {evidenceImage && (
                  <div className="border border-slate-300 rounded p-2 bg-white flex flex-col items-center text-center clinical-image-box w-full">
                    <div className="w-full aspect-[4/3] max-h-[175px] print:max-h-[160px] bg-[#2a0d06] rounded-sm overflow-hidden flex items-center justify-center border border-slate-200">
                      <img
                        src={evidenceImage}
                        alt="Lesion Evidence — Visualization Aid"
                        className="w-full h-full object-contain"
                        loading="eager"
                        decoding="sync"
                      />
                    </div>
                    <div className="mt-1.5 w-full">
                      <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                        Lesion Evidence — Visualization Aid
                      </span>
                      <span className="text-[9.5px] text-slate-500 block leading-tight mt-0.5">
                        {screening?.evidenceGallery?.[0]?.name || (isDemoCase ? "High-Magnification Lesion ROI" : "Generated ROI not available")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] space-y-1 text-slate-700 pt-0.5">
                <p className="leading-snug">
                  <strong className="text-slate-950">Spatial Attention Focus:</strong> {withDemoFallback(explainability?.heatmapDescription, "Superior-temporal arcade and parafoveal zone.")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-1.5 pt-0.5 text-[10px]">
                  {(explainability?.attentionHotspots || (isDemoCase ? [
                    { feature: "Circinate Hard Exudates", intensity: 0.94 },
                    { feature: "Blot Hemorrhages Cluster", intensity: 0.88 },
                    { feature: "Microaneurysm Focus", intensity: 0.81 }
                  ] : [])).map((hotspot, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 px-2 py-1 rounded">
                      <span className="font-semibold text-slate-900 block truncate">{hotspot.feature}</span>
                      <span className="text-slate-500 font-mono text-[9px]">
                        Activation Intensity: {(hotspot.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic pt-0.5">
                  Note: AI attention visualization reflects convolutional gradient weighting. Not independent diagnostic evidence.
                </p>
              </div>
            </section>

            {/* 2. Confidence & Uncertainty + 3. Probability Distribution (Compact 2-Column Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2">
              {/* 2. Confidence & Uncertainty */}
              <section aria-labelledby="p2-confidence-heading" className="border border-slate-300 rounded p-2.5 bg-slate-50/70 space-y-1.5">
                <h2 id="p2-confidence-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                  2. Model Scores & Uncertainty
                </h2>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 font-medium">Uncertainty status:</span>
                    <strong className="text-slate-900 text-xs">{`${withDemoFallback(aiResult?.uncertaintyTier, "Tier 3 — Confident Referable")}${isDemoCase ? " (demo)" : ""}`}</strong>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 font-medium">Predictive Entropy:</span>
                    <span className="font-mono font-bold text-slate-800">{aiResult?.uncertaintyScore != null ? `${aiResult.uncertaintyScore} (normalized entropy)` : (isDemoCase ? "0.116 (Low entropy)" : "Not assessed")}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-600 font-medium">Uncalibrated model score:</span>
                    <span className="font-semibold text-slate-800">{aiResult?.confidence != null ? `${aiResult.confidence}%${isDemoCase ? " (demo)" : ""}` : (isDemoCase ? "88.4% (demo)" : "Not assessed")}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug pt-1 border-t border-slate-200">
                    {withDemoFallback(modelAlternatives?.uncertaintyContext, "Demo value only; this uncertainty tier has not been clinically validated.")}
                  </p>
                </div>
              </section>

              {/* 3. Probability Distribution (Compact & Easy to Read) */}
              <section aria-labelledby="p2-distribution-heading" className="border border-slate-300 rounded p-2.5 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h2 id="p2-distribution-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                    3. Probability Distribution
                  </h2>
                  <span className="text-[10px] font-bold text-blue-900">ICDR 5-Class Output</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  {probabilities.length > 0 ? probabilities.map((p) => {
                    const isSelected = p.level === aiResult?.drLevel;
                    return (
                      <div key={p.level} className="flex items-center gap-1.5">
                        <span className={`w-28 truncate font-medium ${isSelected ? "text-slate-950 font-bold" : "text-slate-600"}`}>
                          L{p.level} ({p.label.split(":")[1]?.trim() || ""})
                        </span>
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isSelected ? "bg-blue-700" : "bg-slate-400"}`}
                            style={{ width: `${Math.max(p.probability, 1)}%` }}
                          />
                        </div>
                        <span className={`w-10 text-right font-mono text-[10px] ${isSelected ? "font-extrabold text-blue-950" : "text-slate-600"}`}>
                          {p.probability.toFixed(1)}%
                        </span>
                      </div>
                    );
                  }) : <p className="text-slate-500">Class probabilities are not available.</p>}
                </div>
              </section>
            </div>

            {/* 4. Doctor Review Record (5. Clinical Verdict & 6. Clinical Notes integrated) */}
            <section aria-labelledby="p2-doctor-review-heading" className="border-2 border-slate-800 rounded p-3 bg-white space-y-2">
              <div className="flex flex-row items-center justify-between border-b border-slate-200 pb-1.5">
                <h2 id="p2-doctor-review-heading" className="text-[11px] font-extrabold uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-900" />
                  <span>4. Doctor Review & Decision Record</span>
                </h2>
                <div className="text-[10px] text-slate-600 font-medium">
                  Review recorded: <span className="font-semibold text-slate-900">{doctorReview?.reviewTimestamp || (isDemoCase ? generatedAt : "Not reviewed")}</span>
                </div>
              </div>

              {/* 5. Clinical Verdict Bar */}
              <div className="bg-slate-50 border border-slate-300 rounded p-2 flex flex-col sm:flex-row print:flex-row sm:items-center print:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">5. Clinical Verdict</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2.5 py-0.5 rounded text-xs font-black bg-blue-900 text-white uppercase tracking-wider">
                      {doctorReview?.decision || (isDemoCase ? "Confirmed" : "Pending review")}
                    </span>
                    <strong className="text-slate-950 text-xs">
                      {doctorReview?.urgency || (isDemoCase ? "Priority Referral (Review within 2-4 weeks)" : "Not assessed")}
                    </strong>
                  </div>
                </div>
                <div className="text-left sm:text-right print:text-right border-t sm:border-t-0 print:border-t-0 pt-1 sm:pt-0 print:pt-0 border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Reviewer (identity not authenticated)</span>
                  <strong className="text-slate-950 text-xs block">{doctorReview?.reviewerName || (isDemoCase ? "Dr. Rajesh Sharma, MD (Ophthalmology)" : "Not provided")}</strong>
                  <span className="text-[10px] text-slate-600 font-mono">Reg. No: {doctorReview?.registrationNumber || (isDemoCase ? "MCI-48920-MH" : "Not provided")}</span>
                </div>
              </div>

              {/* 6. Clinical Notes */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  6. Clinical Notes & Referral Instructions
                </span>
                <p className="text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded p-2 font-medium leading-relaxed">
                  {doctorReview?.doctorNotes || (isDemoCase ? "AI screening findings confirmed. Patient exhibits moderate NPDR with hard exudates threatening macular center. Urgent referral generated for Vitreo-Retinal specialist at Sasoon General Hospital Pune. Advised strict glycemic control and repeat OCT within 3 weeks." : "No clinician review has been recorded.")}
                </p>
              </div>

              {/* Doctor Attestation Statement & Signature/Stamp Block */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row print:flex-row items-end justify-between gap-3">
                <p className="text-[9.5px] text-slate-600 leading-tight italic max-w-sm">
                  {isDemoCase
                    ? "Demonstration content only. This sample does not represent a real clinician attestation."
                    : doctorReview
                      ? "A review decision is recorded. Reviewer identity and signature are not authenticated by this application."
                      : "No clinician review or attestation has been recorded."}
                </p>
                <div className="w-48 border border-dashed border-slate-400 rounded p-2 text-center bg-slate-50/50 shrink-0">
                  <div className="h-8 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                    {doctorReview ? (isDemoCase ? "Demo sample only" : "No verified signature") : "Not signed"}
                  </div>
                  <div className="border-t border-slate-300 pt-0.5 text-[9px] font-bold text-slate-700 uppercase">
                    Signature not recorded
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Patient-Friendly Explanation (Clearly Separated from Clinician Interpretation) */}
            <section aria-labelledby="p2-patient-explanation" className="border border-blue-200 rounded p-3 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-1">
                <h2 id="p2-patient-explanation" className="text-[11px] font-bold uppercase tracking-wider text-blue-950">
                  7. Patient-Friendly Explanation
                </h2>
                <span className="text-[10px] text-blue-800 font-medium">Information for Patient & Family Counseling</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-800">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-950">8. What was found?</h3>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {isDemoCase
                      ? "This is an illustrative demo record, not a real screening or patient result."
                      : aiResult?.drLevel != null
                        ? `The automated screening returned ICDR level ${aiResult.drLevel}. This is a screening output and is not a confirmed diagnosis.`
                        : "No automated grade is available for this screening."}
                  </p>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-950">9. What does this mean?</h3>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    Over time, high blood sugar can cause small blood vessels in the eye to swell or leak tiny spots of fluid.                     A qualified clinician can explain how screening findings relate to your individual eye health.
                  </p>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-950">10. What happens next?</h3>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {doctorReview?.urgency || aiResult?.referralUrgency
                      ? `Recorded next-step guidance: ${doctorReview?.urgency || aiResult.referralUrgency}. Confirm the plan with a qualified eye-care professional.`
                      : "No referral urgency or clinician-directed next step has been recorded. Discuss your eye health with a qualified clinician."}
                  </p>
                </div>
              </div>
            </section>

            {/* 11. Model Information & Limitations */}
            <section aria-labelledby="p2-limitations-heading" className="border-t border-slate-300 pt-2 space-y-1 text-[10px] text-slate-600">
              <h2 id="p2-limitations-heading" className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800">
                11. Model Information & Limitations
              </h2>
              <p className="leading-tight text-slate-700">
                <strong className="text-slate-900">Model Architecture:</strong> EfficientNet-B0 with a five-class ICDR classification head. The configured training pipeline uses the supplied IDRiD graded data. {isDemoCase ? "Displayed demo predictions are illustrative static examples and were not generated by this trained model." : aiResult ? "A checkpoint-backed prediction is present; external and clinical validation have not been established." : "No model prediction is available for this screening."}
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 leading-tight">
                <li>The model cannot establish a final clinical diagnosis (screening decision-support only).</li>
                <li>The model cannot determine systemic anti-diabetic medication or anti-VEGF injection dosage.</li>
                <li>The model cannot predict individual rate of future disease progression or visual acuity loss.</li>
                <li>The model cannot replace dilated slit-lamp biomicroscopy or high-resolution macular OCT.</li>
              </ul>
              <p className="text-[9.5px] text-slate-500 italic leading-snug pt-0.5 border-t border-slate-200">
                This AI-assisted tele-screening output is an adjunctive decision-support tool. It does not constitute an independent medical prescription or definitive diagnosis. Final clinical verification and management plan remain under the strict authority of the registered ophthalmic practitioner.
              </p>
            </section>
          </div>

          {/* Page 2 Footer */}
          <footer className="mt-3 print:mt-2 pt-2.5 print:pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <div>
              Report ID: <span className="font-mono font-semibold text-slate-800">{reportId}</span>
            </div>
            <div className="text-center font-semibold text-slate-700">
              Confidential Clinical Screening Report
            </div>
            <div className="font-bold text-slate-800">
              Page 2 of 2
            </div>
          </footer>
        </article>
      </div>

      {/* Interactive High-Resolution Fundus Inspection Modal (Screen Only, Hidden in Print) */}
      {inspectingImage && (
        <div
          className="fixed inset-0 z-50 no-print flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => {
            setInspectingImage(null);
            setInspectZoom(1);
            setShowInspectGrid(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="High-Resolution Fundus Inspection"
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{inspectingImage.title}</span>
                    <span className="text-xs bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded font-mono">
                      {inspectingImage.eye}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {inspectingImage.modality} • {inspectingImage.desc || "Image details not provided"}
                  </p>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setInspectZoom((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                    className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-200 px-1.5 min-w-[50px] text-center">
                    {Math.round(inspectZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectZoom((prev) => Math.min(3.0, Number((prev + 0.25).toFixed(2))))}
                    className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectZoom(1);
                      setShowInspectGrid(false);
                    }}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded border-l border-slate-700 ml-0.5 pl-1.5"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInspectGrid((prev) => !prev)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded border transition-colors ${
                    showInspectGrid
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  title="Toggle illustrative reference grid (not calibrated for measurement)"
                >
                  Reference Grid
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInspectingImage(null);
                    setInspectZoom(1);
                    setShowInspectGrid(false);
                  }}
                  className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 ml-2"
                  title="Close inspection view"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Viewport */}
            <div className="relative flex-1 bg-black overflow-auto p-4 flex items-center justify-center min-h-[420px]">
              <div
                className="relative transition-transform duration-150 ease-out max-w-full"
                style={{ transform: `scale(${inspectZoom})` }}
              >
                <img
                  src={inspectingImage.url}
                  alt={inspectingImage.title}
                  className="max-h-[65vh] w-auto aspect-square object-contain rounded select-none shadow-2xl"
                />

                {/* Illustrative grid overlay; it is not calibrated to the image. */}
                {showInspectGrid && (
                  <div className="absolute inset-0 pointer-events-none border border-emerald-400/40 rounded flex items-center justify-center">
                    {/* Crosshairs */}
                    <div className="absolute inset-x-0 top-1/2 border-t border-emerald-400/30"></div>
                    <div className="absolute inset-y-0 left-1/2 border-l border-emerald-400/30"></div>

                    {/* Reference rings are not calibrated for measurement. */}
                    <div className="absolute w-[20%] h-[20%] rounded-full border border-dashed border-emerald-400/60"></div>
                    <div className="absolute w-[50%] h-[50%] rounded-full border border-emerald-400/40"></div>
                    <div className="absolute w-[85%] h-[85%] rounded-full border border-emerald-400/30"></div>

                    {/* Quadrant Labels */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-emerald-300 text-[10px] font-mono px-1 rounded">
                      Superior
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-emerald-300 text-[10px] font-mono px-1 rounded">
                      Inferior
                    </div>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-emerald-300 text-[10px] font-mono px-1 rounded">
                      {inspectingImage.eye === "OS" ? "Nasal (Disc)" : inspectingImage.eye === "OD" ? "Temporal (Macula)" : "Orientation unknown"}
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-emerald-300 text-[10px] font-mono px-1 rounded">
                      {inspectingImage.eye === "OS" ? "Temporal (Macula)" : inspectingImage.eye === "OD" ? "Nasal (Disc)" : "Orientation unknown"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Info Bar */}
            <div className="px-4 py-2 bg-slate-800/90 border-t border-slate-700 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span>Field: <strong className="text-white">Not provided</strong></span>
                <span>Camera: <strong className="text-white">{patient?.cameraModel?.split("(")[0]?.trim() || (isDemoCase ? "Forus 3nethra HD" : "Not provided")}</strong></span>
                <span>Resolution: <strong className="text-white">Not provided</strong></span>
              </div>
              <div className="text-[11px] text-slate-500">
                Tip: Click outside or press Esc to close • Zoom up to 300% for microvascular scrutiny
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
