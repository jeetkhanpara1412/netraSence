import React from "react";
import { Eye, FileText, LayoutDashboard, LogIn, LogOut, Minus, Plus } from "lucide-react";

export default function Navbar({
  currentPath = "/",
  onNavigate,
  aiStatus = "Checking backend...",
  uiScale = 0.8,
  onUpdateUiScale,
  currentUser = null,
  onSignIn,
  onSignOut,
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
      <div className="max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 min-h-[56px] sm:min-h-[60px] flex items-center justify-between gap-3">
        {/* Left: Product Name & Subtitle */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight truncate">
                RetinaSight AI
              </h1>
              <span className="md:hidden flex items-center" title={aiStatus}>
                <span className={`w-2 h-2 rounded-full inline-block ${aiStatus === "Ready" ? "bg-emerald-500" : "bg-amber-500"}`} />
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-tight truncate hidden xs:block">
              Explainable Diabetic Retinopathy Screening
            </p>
          </div>
        </div>

        {/* Center / Metadata: Runtime AI status */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4 text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${aiStatus === "Ready" ? "bg-emerald-500" : "bg-amber-500"}`} />
            Service status
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">
            AI Status: <strong className="text-slate-800 font-semibold">{aiStatus}</strong>
          </span>
        </div>

        {/* Right: UI Scale Controller & Page Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="hidden xl:inline max-w-36 truncate text-xs text-slate-600" title={currentUser.email}>
                {currentUser.full_name}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="flex min-h-[36px] items-center gap-1.5 rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                title="Sign out of this browser session"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="flex min-h-[36px] items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign in</span>
            </button>
          )}

          {/* UI Scale Controller (compact 20% smaller default) */}
          <div
            className="flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-1.5 py-1 rounded-md text-xs text-slate-600 min-h-[36px]"
            title="System UI Scale (Compact 80% default)"
          >
            <span className="text-[11px] font-medium text-slate-500 pl-1 hidden sm:inline">Scale:</span>
            <button
              id="ui-scale-dec-btn"
              type="button"
              onClick={() => onUpdateUiScale && onUpdateUiScale(Math.max(0.65, Number((uiScale - 0.05).toFixed(2))))}
              className="p-1 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-700 transition-colors w-7 h-7 flex items-center justify-center"
              title="Make UI smaller (-5%)"
              aria-label="Decrease UI scale"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 px-1 min-w-[36px] text-center tabular-nums select-none">
              {Math.round(uiScale * 100)}%
            </span>
            <button
              id="ui-scale-inc-btn"
              type="button"
              onClick={() => onUpdateUiScale && onUpdateUiScale(Math.min(1.2, Number((uiScale + 0.05).toFixed(2))))}
              className="p-1 hover:bg-slate-200 active:bg-slate-300 rounded text-slate-700 transition-colors w-7 h-7 flex items-center justify-center"
              title="Make UI larger (+5%)"
              aria-label="Increase UI scale"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Navigation */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium shrink-0">
            <button
              id="nav-dashboard-btn"
              type="button"
              onClick={() => onNavigate("/")}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 min-h-[36px] rounded-md transition-colors text-xs font-semibold ${
                currentPath === "/"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Screening</span>
            </button>

            <button
              id="nav-report-btn"
              type="button"
              onClick={() => onNavigate("/report")}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 min-h-[36px] rounded-md transition-colors text-xs font-semibold ${
                currentPath === "/report"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Report</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
