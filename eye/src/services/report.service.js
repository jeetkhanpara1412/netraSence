/**
 * Report Service
 * Synchronizes with screening session and formats the complete 15-section clinical report.
 * Future Django compatible:
 *   GET /api/reports/{id}
 */

import { api } from "./api.js";
import { screeningService } from "./screening.service.js";
import { exportReportToPdf, printReport, generatePdfFilename } from "../utils/printUtility.js";

export const reportService = {
  getReport: async (reportId) => {
    let reportFetchError = null;
    // 1. Attempt fetching from real FastAPI/PostgreSQL backend
    if (reportId && reportId !== "SCN-CURRENT") {
      try {
        const backendReport = await api.get(`/api/screenings/${reportId}/report`);
        if (backendReport && backendReport.reportId) {
          return {
            ...backendReport,
            teleHealthCenter: {
              facility: backendReport.facility?.name || "Not provided",
              nodalHospital: backendReport.facility?.nodalHospital || "Not provided",
              mouPartner: "Not provided"
            },
            disclaimer: "AI-assisted tele-screening tool developed for early detection in low-resource primary care. This automated output does not constitute an independent medical prescription or definitive diagnosis. Final clinical verification and management plan remain under the strict authority of the registered ophthalmic practitioner."
          };
        }
        reportFetchError = new Error("The backend did not return a report for the requested screening.");
      } catch (err) {
        reportFetchError = err;
        console.warn("Could not fetch the remote report; checking the matching screening session:", err.message);
      }
    }

    // Retrieve active screening data
    const screening = await screeningService.getScreening(reportId);
    if (reportFetchError && screening.caseType !== "DEMO_CASE") {
      throw reportFetchError;
    }
    return {
      reportId: `REP-${screening.id.replace("SCN-", "")}`,
      generatedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      screening,
      teleHealthCenter: screening.caseType === "DEMO_CASE"
        ? {
            facility: "Maharashtra Tele-Ophthalmology Network (Vision Mission India)",
            nodalHospital: "Sasoon General Hospital & B.J. Medical College, Pune",
            mouPartner: "Smart India Hackathon 2026 Telemedicine Initiative"
          }
        : {
            facility: "Not provided",
            nodalHospital: "Not provided",
            mouPartner: "Not provided"
          },
      disclaimer: "AI-assisted tele-screening tool developed for early detection in low-resource primary care. This automated output does not constitute an independent medical prescription or definitive diagnosis. Final clinical verification and management plan remain under the strict authority of the registered ophthalmic practitioner."
    };
  },

  exportToPdf: async (report, options) => {
    return exportReportToPdf({ report, ...options });
  },

  printReport: (report, options) => {
    return printReport({ report, ...options });
  },

  generatePdfFilename
};
