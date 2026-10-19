/**
 * Screening Service
 * Encapsulates fundus upload, image quality validation, AI analysis, and doctor decision.
 * Fully compatible with future Django endpoints:
 *   POST /api/screening/upload
 *   POST /api/screening/analyze
 *   GET /api/screening/{id}
 *   POST /api/screening/{id}/doctor-review
 */

import { api } from "./api.js";
import { PRESET_CASES } from "../data/mockScreening.js";
import {
  generateFundusCanvasDataUrl,
  generateEnhancedCanvasDataUrl,
  generateGradCamCanvasDataUrl,
  generateRoiThumbnail
} from "../utils/retinaImages.js";

const ACTIVE_SCREENING_KEY = "retina_ai_active_screening";

// Helper to normalize image URLs from backend
const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${api.baseUrl}${url}`;
};

const normalizeBackendScreening = (backendScreening) => {
  if (!backendScreening) return null;
  const s = { ...backendScreening };
  if (s.images) {
    s.images = {
      original: resolveImageUrl(s.images.original),
      enhanced: resolveImageUrl(s.images.enhanced),
      gradCam: resolveImageUrl(s.images.gradCam),
      evidence: resolveImageUrl(s.images.evidence)
    };
  }
  if (s.explainability?.gradcamUrl) {
    s.explainability.gradcamUrl = resolveImageUrl(s.explainability.gradcamUrl);
  }
  return s;
};

export const screeningService = {
  // Upload fundus image (or select preset)
  uploadFundus: async (fileOrPresetKey, customFile = null) => {
    if (customFile) {
      const formData = new FormData();
      formData.append("file", customFile);

      const response = await api.upload("/api/screenings/upload", formData);
      if (!response?.screening) {
        throw new Error("The backend did not return a screening record for the uploaded image.");
      }
      const session = normalizeBackendScreening(response.screening);
      localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(session));
      return session;
    }

    const template = PRESET_CASES[fileOrPresetKey];
    if (!template) throw new Error(`Unknown demo screening preset: ${fileOrPresetKey}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const caseData = JSON.parse(JSON.stringify(template));
    const eye = caseData.patient?.eye || "OD";
    const originalImageUrl = generateFundusCanvasDataUrl(fileOrPresetKey, 1200, 1200, eye);
    const enhancedImageUrl = generateEnhancedCanvasDataUrl(fileOrPresetKey, 1200, 1200, eye);
    const gradCamImageUrl = generateGradCamCanvasDataUrl(fileOrPresetKey, 1200, 1200, eye);
    const evidenceImageUrl = generateRoiThumbnail(caseData.evidenceGallery?.[0]?.id || "ROI-1", 800, 800);

    const initialSession = {
      ...caseData,
      status: "UPLOADED",
      images: {
        original: originalImageUrl,
        enhanced: enhancedImageUrl,
        gradCam: gradCamImageUrl,
        evidence: evidenceImageUrl
      },
      presetKey: fileOrPresetKey
    };

    localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(initialSession));
    return initialSession;
  },

  // Run explainable AI inference workflow
  analyzeFundus: async (screeningId) => {
    const stored = localStorage.getItem(ACTIVE_SCREENING_KEY);
    if (!stored) throw new Error("No active screening session found");

    const currentSession = JSON.parse(stored);
    if (currentSession.caseType === "DEMO_CASE") {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      currentSession.status = "ANALYZED";
      currentSession.analyzedAt = new Date().toISOString();
      localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(currentSession));
      return currentSession;
    }

    const targetId = screeningId || currentSession.id || currentSession.database_id;
    if (!targetId) throw new Error("The screening has no backend ID; inference cannot be run.");
    const response = await api.post(`/api/screenings/${targetId}/analyze`);
    if (!response || !["ANALYZED", "UNGRADABLE"].includes(response.status)) {
      throw new Error("The backend did not complete this screening analysis.");
    }
    const session = normalizeBackendScreening(response);
    session.analyzedAt = new Date().toISOString();
    localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(session));
    return session;
  },

  // Get active or stored screening by ID
  getScreening: async (screeningId) => {
    if (screeningId && screeningId !== "SCN-CURRENT") {
      const stored = localStorage.getItem(ACTIVE_SCREENING_KEY);
      const localSession = stored ? JSON.parse(stored) : null;
      if (localSession?.id === screeningId && localSession.caseType === "DEMO_CASE") {
        return localSession;
      }
      const response = await api.get(`/api/screenings/${screeningId}`);
      if (!response?.id) throw new Error("The backend did not return the requested screening.");
      return normalizeBackendScreening(response);
    }

    const stored = localStorage.getItem(ACTIVE_SCREENING_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      if (!screeningId || screeningId === "SCN-CURRENT" || session.id === screeningId) {
        if (session.presetKey && session.presetKey !== "CUSTOM") {
          const eye = session.patient?.eye || "OD";
          if (!session.images?.evidence || !session.images?.original) {
            session.images = {
              original: generateFundusCanvasDataUrl(session.presetKey, 1200, 1200, eye),
              enhanced: generateEnhancedCanvasDataUrl(session.presetKey, 1200, 1200, eye),
              gradCam: generateGradCamCanvasDataUrl(session.presetKey, 1200, 1200, eye),
              evidence: generateRoiThumbnail(session.evidenceGallery?.[0]?.id || "ROI-1", 800, 800)
            };
            localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(session));
          }
        }
        return session;
      }
    }

    if (screeningId && screeningId !== "SCN-CURRENT") {
      throw new Error("No matching screening session is available.");
    }

    throw new Error("No active screening session is available. Upload an image or select a demo case first.");
  },

  // Save clinician's final assessment
  submitDoctorReview: async (screeningId, reviewData) => {
    const stored = localStorage.getItem(ACTIVE_SCREENING_KEY);
    if (!stored) throw new Error("Screening session not found");

    const session = JSON.parse(stored);
    if (session.caseType !== "DEMO_CASE") {
      const targetId = screeningId || session.id || session.database_id;
      if (!targetId) throw new Error("The screening has no backend ID; the review cannot be saved.");
      const response = await api.post(`/api/screenings/${targetId}/review`, reviewData);
      if (!response?.screening) {
        throw new Error("The backend did not return the updated screening after review.");
      }
      const updatedSession = normalizeBackendScreening(response.screening);
      localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(updatedSession));
      return updatedSession;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    session.doctorReview = {
      ...session.doctorReview,
      ...reviewData,
      reviewTimestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    };
    session.status = "REVIEWED";

    localStorage.setItem(ACTIVE_SCREENING_KEY, JSON.stringify(session));
    return session;
  },

  // Reset screening state
  resetScreening: () => {
    localStorage.removeItem(ACTIVE_SCREENING_KEY);
  }
};
