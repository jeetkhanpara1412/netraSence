import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  ArrowRight,
  Upload,
  ChevronDown,
  Info
} from "lucide-react";
import { screeningService } from "../services/screening.service.js";
import { ICDR_LEVELS } from "../data/mockScreening.js";
import FundusClinicalViewer from "../components/FundusClinicalViewer.jsx";
import EvidenceExplainabilityViewer from "../components/EvidenceExplainabilityViewer.jsx";

export default function DoctorDashboard({
  onNavigateToReport,
  onUpdateAiStatus,
  isAuthenticated = false,
  onRequestSignIn,
  pendingUploadFile = null,
  onPendingUploadHandled
}) {
  const [session, setSession] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("MODERATE_NPDR");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Evidence section active tab: "original" | "enhanced" | "gradcam" | "lesions"
  const [evidenceTab, setEvidenceTab] = useState("gradcam");

  // Self-validation expanded toggle
  const [showSelfValDetails, setShowSelfValDetails] = useState(false);

  // Doctor review state
  const [decision, setDecision] = useState("Mark for Review");
  const [modifiedLevel, setModifiedLevel] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef(null);

  // Initial load
  useEffect(() => {
    loadScreening("MODERATE_NPDR");
  }, []);

  const loadScreening = async (presetKey, customFile = null) => {
    try {
      setErrorMsg("");
      setIsSaved(false);
      const data = await screeningService.uploadFundus(presetKey, customFile);
      setSession(data);
      setSelectedPreset(presetKey);
      setDoctorNotes(data.doctorReview?.doctorNotes || "");
      setDecision(data.doctorReview?.decision || (data.aiResult?.drLevel == null ? "Mark for Review" : "Accept"));
      setModifiedLevel(data.doctorReview?.finalDrLevel ?? data.aiResult?.drLevel ?? null);

      if (onUpdateAiStatus && data.caseType === "DEMO_CASE") {
        onUpdateAiStatus("Demo case");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load screening session.");
    }
  };

  useEffect(() => {
    if (isAuthenticated && pendingUploadFile) {
      loadScreening("CUSTOM", pendingUploadFile);
      onPendingUploadHandled?.();
    }
  }, [isAuthenticated, pendingUploadFile]);

  const handleCustomFileUpload = (fileOrEvent) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : fileOrEvent?.target?.files?.[0];
    if (file) {
      if (!isAuthenticated) {
        setErrorMsg("Sign in with a clinician or administrator account to upload this image.");
        onRequestSignIn?.(file);
        return;
      }
      loadScreening("CUSTOM", file);
    }
  };

  const handleRunAnalysis = async () => {
    if (!session) return;
    setIsAnalyzing(true);
    if (onUpdateAiStatus) onUpdateAiStatus("Analyzing...");
    try {
      const updated = await screeningService.analyzeFundus(session.id);
      setSession(updated);
      setDoctorNotes(updated.doctorReview?.doctorNotes || "");
      setDecision(updated.doctorReview?.decision || (updated.aiResult?.drLevel == null ? "Mark for Review" : "Accept"));
      setModifiedLevel(updated.aiResult?.drLevel ?? null);
      if (onUpdateAiStatus) {
        onUpdateAiStatus(updated.caseType === "DEMO_CASE" ? "Demo result" : "Analyzed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Analysis failed. Please retry.");
      if (onUpdateAiStatus) onUpdateAiStatus("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!session) return;
    const finalDrLevel = decision === "Modify" ? modifiedLevel : session.aiResult?.drLevel;
    if (finalDrLevel == null) {
      setErrorMsg("No screening grade is available to confirm. Select an explicit clinician grade or wait for a valid screening result.");
      return;
    }
    try {
      const reviewPayload = {
        decision,
        finalDrLevel: Number(finalDrLevel),
        doctorNotes
      };
      const updated = await screeningService.submitDoctorReview(session.id, reviewPayload);
      setSession(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save doctor review.");
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 text-sm">Loading screening case...</div>
      </div>
    );
  }

  const { patient, quality, aiResult, lesions, structures, selfValidation } = session;
  const isDemoCase = session.caseType === "DEMO_CASE";
  const isUngradable = quality?.status === "Ungradable";
  const isBorderline = quality?.status === "Borderline";
  const isAnalyzed = session.status === "ANALYZED" || session.status === "REVIEWED";

  const activeLevel = isAnalyzed ? aiResult?.drLevel : null;
  const lesionStatus = (finding) => (
    finding?.detected === true ? "Detected" :
    finding?.detected === false ? "Not detected" : "Not assessed"
  );
  const probabilities = aiResult?.probabilities || (isDemoCase ? [
    { level: 0, label: "Level 0: No DR", probability: 2.1 },
    { level: 1, label: "Level 1: Mild NPDR", probability: 6.8 },
    { level: 2, label: "Level 2: Moderate NPDR", probability: 88.4 },
    { level: 3, label: "Level 3: Severe NPDR", probability: 2.3 },
    { level: 4, label: "Level 4: Proliferative DR", probability: 0.4 }
  ] : []);

  return (
    <div className="max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {errorMsg}
        </div>
      )}

      {/* =========================================================================
          2. PATIENT / EXAMINATION BAR (One compact horizontal section)
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Patient Details - Responsive Grid on Mobile, Flex on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Patient ID</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">{patient.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Patient Name</span>
              <span className="font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none block">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Age / Gender</span>
              <span className="text-slate-700 text-xs sm:text-sm">{patient.age ? `${patient.age} Y` : "Age not provided"} / {patient.gender || "Gender not provided"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Eye</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 inline-block text-xs sm:text-sm">
                {patient.eye}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Exam Date</span>
              <span className="text-slate-700 text-xs sm:text-sm">{patient.examDate}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Fundus Camera</span>
              <span className="text-slate-700 text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none block">{patient.cameraModel || (isDemoCase ? "Forus 3nethra (45°)" : "Not provided")}</span>
            </div>
            {patient.diabetesDuration && (
              <div className="hidden xl:block">
                <span className="text-slate-400 block text-[11px] uppercase font-medium">Diabetes Duration</span>
                <span className="text-slate-700 text-xs sm:text-sm">{patient.diabetesDuration}</span>
              </div>
            )}
            {patient.hba1c && (
              <div className="hidden xl:block">
                <span className="text-slate-400 block text-[11px] uppercase font-medium">HbA1c</span>
                <span className="font-semibold text-slate-900 text-xs sm:text-sm">{patient.hba1c}</span>
              </div>
            )}
          </div>

          {/* Case Switcher & Upload (Responsive Controls) */}
          <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="relative flex-1 sm:flex-none">
              <select
                aria-label="Select Test Case Preset"
                value={selectedPreset}
                onChange={(e) => loadScreening(e.target.value)}
                className="w-full sm:w-auto text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 cursor-pointer pr-8 appearance-none min-h-[40px] h-10"
              >
                {selectedPreset === "CUSTOM" && (
                  <option value="CUSTOM">Case: Custom Uploaded Image</option>
                )}
                <option value="MODERATE_NPDR">Case: Moderate NPDR (Demo)</option>
                <option value="SEVERE_NPDR">Case: Severe NPDR (Demo)</option>
                <option value="NORMAL">Case: Normal (Demo)</option>
                <option value="UNGRADABLE_BLURRED">Case: Ungradable (Demo)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCustomFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs sm:text-sm flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] h-10 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-md font-medium transition-colors shrink-0"
              title="Upload custom retinal fundus image"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN SCREEN — IMAGE + RESULT (Two-column layout)
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT — FUNDUS IMAGE VIEWER */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <FundusClinicalViewer
            session={session}
            images={session.images}
            patient={patient}
            quality={quality}
            lesions={lesions}
            isUngradable={isUngradable}
          />
        </div>

        {/* RIGHT — SCREENING RESULT (One unified clinical result panel) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[auto] lg:min-h-[460px] 2xl:min-h-[500px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              AI-Assisted Screening
            </div>

            {isUngradable ? (
              <div className="my-4 sm:my-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="font-bold text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  Image Quality Insufficient
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Automated staging suppressed due to optical blur or inadequate pupil alignment. Recapture is required before diagnostic grading.
                </p>
                <button
                  type="button"
                  onClick={() => loadScreening("MODERATE_NPDR")}
                  className="mt-2 text-xs font-semibold px-3.5 py-2 min-h-[40px] h-10 rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  Recapture Image
                </button>
              </div>
            ) : !isAnalyzed ? (
              <div className="my-6 sm:my-8 text-center py-6 sm:py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                <div className="text-sm font-semibold text-slate-700 mb-1">Awaiting AI Analysis</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                  Run edge inferencing to obtain ICDR multi-class staging and Grad-CAM saliency attention.
                </p>
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing RetinaSight Engine...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Run Analysis</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 my-2 sm:my-3">
                {/* Level and Label */}
                <div className="border-b border-slate-100 pb-3.5">
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    LEVEL {aiResult?.drLevel ?? "—"}
                  </div>
                  <div className="text-base sm:text-lg font-semibold text-slate-800 mt-0.5">
                    {aiResult?.severityLabel?.replace(" (NPDR)", "") || (isDemoCase ? "Moderate NPDR" : "Not assessed")}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                        aiResult?.referableStatus === "Referable"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : aiResult?.referableStatus === "Non-Referable"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {aiResult?.referableStatus || (isDemoCase ? "Referable (demo)" : "Not assessed")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {aiResult?.referralUrgency || (isDemoCase ? "Priority (demo)" : "Not assessed")}
                    </span>
                  </div>
                </div>

                {/* Model score & Uncertainty */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Uncalibrated model score:</span>
                    <span className="font-semibold text-slate-900 text-sm sm:text-base tabular-nums">
                      {aiResult?.confidence != null ? `${aiResult.confidence}%${isDemoCase ? " (demo)" : ""}` : isDemoCase ? "88.4% (demo)" : "Not assessed"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Uncertainty status:</span>
                    <span className="font-medium text-slate-800 text-right text-xs sm:text-sm">
                      {aiResult?.uncertaintyTier ? `${aiResult.uncertaintyTier}${isDemoCase ? " (demo)" : ""}` : (isDemoCase ? "Tier 3 — Confident Referable (demo)" : "Not assessed")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Mandate Statement */}
          <div className="pt-3.5 sm:pt-4 border-t border-slate-100 mt-4">
            <p className="text-[11px] sm:text-xs text-slate-500 leading-normal italic">
              "AI assists screening. Final clinical decision remains with the doctor."
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. IMAGE QUALITY (Compact section)
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
            Image Quality
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-600">
            Overall:{" "}
            <span
              className={
                quality?.status === "Good"
                  ? "text-emerald-700 font-bold"
                  : quality?.status === "Borderline"
                  ? "text-amber-700 font-bold"
                  : quality?.status === "Ungradable"
                    ? "text-rose-700 font-bold"
                    : "text-slate-600 font-medium"
              }
            >
              {quality?.status}
            </span>
          </div>
        </div>

        {/* 3 Core Quality Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs sm:text-sm">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600">Focus</span>
            <span className={`font-semibold flex items-center gap-1 ${quality?.metrics?.focus?.status && quality.metrics.focus.status !== "Not assessed" ? "text-emerald-700" : "text-slate-600"}`}>
              {quality?.metrics?.focus?.status || (isDemoCase ? "Optimal (demo)" : "Not assessed")}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600">Illumination</span>
            <span className={`font-semibold flex items-center gap-1 ${quality?.metrics?.illumination?.status && quality.metrics.illumination.status !== "Not assessed" ? "text-emerald-700" : "text-slate-600"}`}>
              {quality?.metrics?.illumination?.status || (isDemoCase ? "Good (demo)" : "Not assessed")}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600">Field of View</span>
            <span className={`font-semibold flex items-center gap-1 ${quality?.metrics?.fieldOfView?.status && quality.metrics.fieldOfView.status !== "Not assessed" ? "text-emerald-700" : "text-slate-600"}`}>
              {quality?.metrics?.fieldOfView?.status || (isDemoCase ? "Full 45° (demo)" : "Not assessed")}
            </span>
          </div>
        </div>

        {/* Quality warnings if applicable */}
        {isBorderline && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs sm:text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>⚠ Borderline image: Consider improving focus before final review.</span>
          </div>
        )}

        {isUngradable && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs sm:text-sm text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>⚠ Image quality insufficient for reliable screening.</span>
            <button
              type="button"
              onClick={() => loadScreening("MODERATE_NPDR")}
              className="text-xs font-semibold px-3.5 py-1.5 min-h-[38px] h-[38px] bg-rose-600 hover:bg-rose-700 text-white rounded-md shrink-0"
            >
              Recapture Image
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          5. DR SEVERITY (One clean horizontal scale, reflowable)
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
        <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          DR Severity Scale (ICDR Standard)
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {ICDR_LEVELS.map((item) => {
            const isPredicted = activeLevel === item.level;
            return (
              <div
                key={item.level}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isPredicted
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-xs"
                    : "border-slate-200 bg-slate-50/70 text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className={isPredicted ? "text-blue-900 font-bold text-xs sm:text-sm" : "text-slate-800 text-xs sm:text-sm"}>
                    {item.level} — {item.name}
                  </span>
                  {isPredicted && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 leading-normal">
                  {item.referral}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          6. EVIDENCE & EXPLAINABILITY (ONE unified section)
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <EvidenceExplainabilityViewer
          session={session}
          evidenceTab={evidenceTab}
          setEvidenceTab={setEvidenceTab}
        />
      </section>

      {/* =========================================================================
          7. LESION FINDINGS & RETINAL STRUCTURES
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs space-y-4">
        {/* Retinal Structures (Compact Row) */}
        <div>
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
            Retinal Structures
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Optic Disc</span>
              <span className="font-semibold text-slate-800">{structures?.opticDisc?.status || (isDemoCase ? "Sharp margins (C:D 0.35)" : "Not assessed")}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Fovea / Macula</span>
              <span className="font-semibold text-slate-800">{structures?.maculaFovea?.status || (isDemoCase ? "Clear" : "Not assessed")}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Blood Vessels</span>
              <span className="font-semibold text-slate-800">{structures?.vessels?.status || (isDemoCase ? "Normal caliber" : "Not assessed")}</span>
            </div>
          </div>
        </div>

        {/* Lesion Findings (Responsive Table) */}
        <div>
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
            Lesion Findings
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-md no-scrollbar">
            <table className="w-full text-left text-xs sm:text-sm min-w-[280px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Finding</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">Microaneurysms</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold inline-block ${
                      lesions?.microaneurysms?.detected
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "text-slate-500"
                    }`}>
                      {lesionStatus(lesions?.microaneurysms)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    {lesions?.microaneurysms?.detected ? (
                      <button
                        type="button"
                        onClick={() => setEvidenceTab("lesions")}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs min-h-[34px] px-2.5 py-1"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">Hemorrhages</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold inline-block ${
                      lesions?.hemorrhages?.detected
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "text-slate-500"
                    }`}>
                      {lesionStatus(lesions?.hemorrhages)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    {lesions?.hemorrhages?.detected ? (
                      <button
                        type="button"
                        onClick={() => setEvidenceTab("lesions")}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs min-h-[34px] px-2.5 py-1"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">Exudates</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold inline-block ${
                      lesions?.exudates?.detected
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "text-slate-500"
                    }`}>
                      {lesionStatus(lesions?.exudates)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    {lesions?.exudates?.detected ? (
                      <button
                        type="button"
                        onClick={() => setEvidenceTab("lesions")}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs min-h-[34px] px-2.5 py-1"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3.5 font-medium text-slate-800">Neovascularization</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-semibold inline-block ${
                      lesions?.neovascularization?.detected
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "text-slate-500"
                    }`}>
                      {lesionStatus(lesions?.neovascularization)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    {lesions?.neovascularization?.detected ? (
                      <button
                        type="button"
                        onClick={() => setEvidenceTab("lesions")}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs min-h-[34px] px-2.5 py-1"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. MODEL SCORES + UNCERTAINTY
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs space-y-4">
        <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
          Model scores & uncertainty
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* ONE probability chart */}
          <div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              ICDR Multi-Class Probability Distribution
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm">
              {probabilities.length > 0 ? probabilities.map((p) => (
                <div key={p.level} className="flex items-center gap-2">
                  <span className="w-24 sm:w-32 text-slate-600 truncate text-xs shrink-0">
                    Level {p.level} ({p.label.split(":")[1]?.trim() || ""})
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 sm:h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        p.level === aiResult?.drLevel ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      style={{ width: `${Math.max(p.probability, 1.5)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-semibold text-slate-800 text-xs shrink-0 tabular-nums">
                    {p.probability.toFixed(1)}%
                  </span>
                </div>
              )) : <p className="text-slate-500">Class probabilities are not available.</p>}
            </div>
          </div>

          {/* Uncertainty & Small Self-Validation */}
          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Uncertainty Indicator
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                  {aiResult?.uncertaintyTier ? `${aiResult.uncertaintyTier}${isDemoCase ? " (demo)" : ""}` : (isDemoCase ? "Tier 3 — Confident Referable (demo)" : "Not assessed")}
                </div>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  {isDemoCase
                    ? "Demonstration values only; uncertainty and referral thresholds have not been clinically validated."
                    : aiResult?.uncertaintyScore != null
                      ? "Normalized entropy is calculated from model scores; it is uncalibrated and not a measure of clinical certainty."
                      : "Uncertainty has not been assessed."}
                </p>
              </div>
            </div>

            {/* Self-Validation (Small & Clean) */}
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Explanation Consistency
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <div className="flex items-center justify-between font-semibold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{selfValidation?.status || (isDemoCase ? "Demonstration only" : "Not assessed")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSelfValDetails(!showSelfValDetails)}
                    className="text-slate-700 hover:text-slate-900 underline text-xs min-h-[30px] px-1.5 flex items-center"
                  >
                    {showSelfValDetails ? "Hide" : "Details"}
                  </button>
                </div>
                {showSelfValDetails && (
                  <p className="mt-1.5 text-xs text-slate-700 leading-relaxed pt-1.5 border-t border-slate-200">
                    {selfValidation?.summary || (isDemoCase ? "Demonstration only; no measured lesion-alignment score is available." : "No self-validation summary is available.")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. DOCTOR REVIEW (Final major section)
         ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-5 shadow-xs space-y-4">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
          Doctor Review
        </h2>

        {/* AI Recommendation Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium">Research classification</span>
            <strong className="text-slate-800 text-xs sm:text-sm">
              {aiResult?.drLevel != null
                ? `Level ${aiResult.drLevel} — ${aiResult.severityLabel?.split("(")[0]?.trim() || "Not assessed"}`
                : isDemoCase ? "Level 2 — Moderate NPDR (demo)" : "Not assessed"}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium">Uncalibrated score</span>
            <strong className="text-slate-800 text-xs sm:text-sm tabular-nums">{aiResult?.confidence != null ? `${aiResult.confidence}%${isDemoCase ? " (demo)" : ""}` : isDemoCase ? "88.4% (demo)" : "Not assessed"}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium">Evidence Summary</span>
            <span className="text-slate-700 text-xs sm:text-sm">{[
              lesions?.microaneurysms?.detected === true && "Microaneurysms",
              lesions?.hemorrhages?.detected === true && "Hemorrhages",
              lesions?.exudates?.detected === true && "Exudates"
            ].filter(Boolean).join(", ") || (isDemoCase ? "Microaneurysms, Hemorrhages, Exudates (demo)" : "Not assessed")}</span>
          </div>
        </div>

        {/* Doctor Decision Buttons */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
            Doctor Decision:
          </label>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {[
              { id: "Accept", label: "Accept AI Result" },
              { id: "Modify", label: "Modify Result" },
              { id: "Mark for Review", label: "Mark for Review" },
              { id: "Refer", label: "Refer" }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDecision(opt.id)}
                className={`py-2.5 px-3 min-h-[42px] h-[42px] rounded-md text-xs sm:text-sm font-semibold border transition-all flex items-center justify-center ${
                  decision === opt.id
                    ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* If Modify: clean selector */}
          {decision === "Modify" && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="font-semibold text-slate-700">Modified Grade:</span>
              <select
                aria-label="Doctor Modified Grade"
                value={modifiedLevel ?? ""}
                onChange={(e) => setModifiedLevel(e.target.value === "" ? null : Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-md px-3 py-2 min-h-[40px] h-10 text-xs sm:text-sm font-medium text-slate-800"
              >
                <option value="">Select clinician grade</option>
                <option value={0}>Level 0: No DR</option>
                <option value={1}>Level 1: Mild NPDR</option>
                <option value={2}>Level 2: Moderate NPDR</option>
                <option value={3}>Level 3: Severe NPDR</option>
                <option value={4}>Level 4: Proliferative DR</option>
              </select>
            </div>
          )}
        </div>

        {/* Doctor Notes Textarea */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Doctor Clinical Notes:
          </label>
          <textarea
            rows={3}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Document clinical verification, biomicroscopy correlation, or management instructions..."
            className="w-full text-xs sm:text-sm p-3 rounded-md border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white min-h-[84px]"
          />
        </div>

        {/* Confirm Decision Button & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveDecision}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] h-[42px] bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center justify-center"
          >
            Confirm Decision
          </button>

          {isSaved && (
            <span className="text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Review decision saved to screening record. Reviewer identity is not authenticated.</span>
            </span>
          )}
        </div>

        {/* Final Mandate Disclaimer */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[11px] sm:text-xs text-slate-500 italic">
            AI-assisted screening. Final clinical decision remains with the doctor.
          </p>
        </div>
      </section>

      {/* =========================================================================
          10. ACTIONS (Generate Report / Reset)
         ========================================================================= */}
      <section className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => loadScreening("MODERATE_NPDR")}
          className="w-full xs:w-auto text-xs sm:text-sm text-slate-600 hover:text-slate-900 font-medium px-5 py-2.5 min-h-[42px] h-[42px] rounded-md border border-slate-300 hover:bg-slate-100 transition-colors text-center"
        >
          Reset Screening
        </button>

        <button
          type="button"
          onClick={onNavigateToReport}
          className="w-full xs:w-auto flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Report</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
