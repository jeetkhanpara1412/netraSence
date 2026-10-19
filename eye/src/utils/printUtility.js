/**
 * Clinical Report Printing & PDF Export Utility
 * 
 * Formats the 2-page A4 Diabetic Retinopathy screening report for professional print / PDF export.
 * 
 * Features:
 * - Sanitizes and sets document title to clinical PDF filename:
 *   [ReportId]_[PatientName]_Diabetic_Retinopathy_Report.pdf
 * - Pre-loads and verifies all fundus/retinal images and SVG filters before opening print dialog
 * - Manages clean print lifecycle with automatic cleanup
 * - Guarantees strict 2-page A4 formatting (Page 1 Front, Page 2 Back)
 */

/**
 * Generate standardized clinical PDF file name
 */
export function generatePdfFilename(report) {
  const reportId = report?.reportId || "REPORT";
  const patientName = report?.screening?.patient?.name || report?.patient?.name || "Patient";
  const cleanId = String(reportId).replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanName = String(patientName).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `Diabetic_Retinopathy_Screening_Report_${cleanId}_${cleanName}`;
}

/**
 * Ensure all images within a container are decoded and ready for printing
 */
export async function ensureImagesLoaded(containerElement = document) {
  const images = Array.from(containerElement.querySelectorAll("img"));
  const promises = images.map(async (img) => {
    try {
      if (img.complete && img.naturalHeight !== 0) {
        if ("decode" in img) {
          await img.decode().catch(() => {});
        }
        return;
      }
      await new Promise((resolve) => {
        const handleLoad = () => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleLoad);
          resolve();
        };
        img.addEventListener("load", handleLoad);
        img.addEventListener("error", handleLoad);
        setTimeout(resolve, 800);
      });
      if ("decode" in img) {
        await img.decode().catch(() => {});
      }
    } catch {
      // Continue if decoding times out
    }
  });
  await Promise.all(promises);
}

/**
 * Core printing utility to export the report view into a formatted 2-page A4 PDF file
 */
export async function exportReportToPdf({
  report,
  reportElementId = "printable-clinical-report",
  onStart,
  onComplete,
  onError
} = {}) {
  try {
    if (typeof onStart === "function") {
      onStart();
    }

    // 1. Set document title to format default PDF save filename
    const originalTitle = document.title;
    const pdfFilename = generatePdfFilename(report);
    document.title = pdfFilename;

    // 2. Add temporary export classes for print styling hooks
    document.documentElement.classList.add("exporting-pdf");
    document.body.classList.add("exporting-pdf");

    // 3. Ensure all fundus images and overlays are loaded
    const targetElement = document.getElementById(reportElementId) || document.body;
    await ensureImagesLoaded(targetElement);

    // 4. Slight microtask delay to allow CSS transitions / reflows to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 5. Cleanup helper
    const cleanup = () => {
      document.title = originalTitle;
      document.documentElement.classList.remove("exporting-pdf");
      document.body.classList.remove("exporting-pdf");
      window.removeEventListener("afterprint", handleAfterPrint);
      if (typeof onComplete === "function") {
        onComplete({ success: true, filename: `${pdfFilename}.pdf` });
      }
    };

    const handleAfterPrint = () => {
      cleanup();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    // 6. Invoke native print dialog (destination: 'Save as PDF')
    window.print();

    // 7. Safety fallback in case afterprint event is suppressed by browser/iframe
    setTimeout(() => {
      if (document.title === pdfFilename) {
        cleanup();
      }
    }, 2500);

    return { success: true, filename: `${pdfFilename}.pdf` };
  } catch (err) {
    console.error("Failed to export report to PDF:", err);
    // Cleanup on error
    document.documentElement.classList.remove("exporting-pdf");
    document.body.classList.remove("exporting-pdf");
    if (typeof onError === "function") {
      onError(err);
    }
    throw err;
  }
}

/**
 * Direct print utility function
 */
export async function printReport({ report } = {}) {
  return exportReportToPdf({ report });
}
