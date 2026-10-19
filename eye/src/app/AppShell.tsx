import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import DoctorDashboard from "../pages/DoctorDashboard.jsx";
import ReportPage from "../pages/ReportPage.jsx";
import AuthDialog from "../components/AuthDialog.jsx";
import { useClinicalSession } from "./useClinicalSession";

export default function AppShell() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname === "/report" ? "/report" : "/"
  );
  const [uiScale, setUiScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("retinasight_ui_scale");
      return saved ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });

  const {
    currentUser,
    aiStatus,
    isAuthDialogOpen,
    pendingUploadFile,
    setIsAuthDialogOpen,
    setPendingUploadFile,
    handleSignIn,
    handleSignOut,
    setAiStatus,
  } = useClinicalSession();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname === "/report" ? "/report" : "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.style.zoom = `${uiScale}`;
      try {
        localStorage.setItem("retinasight_ui_scale", String(uiScale));
      } catch {
        // ignore
      }
    }
  }, [uiScale]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigateTo}
        aiStatus={aiStatus}
        uiScale={uiScale}
        onUpdateUiScale={setUiScale}
        currentUser={currentUser}
        onSignIn={() => setIsAuthDialogOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 pb-12">
        {currentPath === "/report" ? (
          <ReportPage onNavigateToDashboard={() => navigateTo("/")} />
        ) : (
          <DoctorDashboard
            onNavigateToReport={() => navigateTo("/report")}
            onUpdateAiStatus={setAiStatus}
            isAuthenticated={Boolean(currentUser)}
            onRequestSignIn={(file) => {
              if (file) setPendingUploadFile(file);
              setIsAuthDialogOpen(true);
            }}
            pendingUploadFile={pendingUploadFile}
            onPendingUploadHandled={() => setPendingUploadFile(null)}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">RetinaSight AI</span>
            <span> — Clinical Screening Workstation</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Clinical review required • Sign in required for real-image workflows
          </div>
        </div>
      </footer>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onSubmit={handleSignIn}
      />
    </div>
  );
}
