import React, { useState } from "react";
import { Wifi, CheckCircle2, HardDrive, RefreshCw } from "lucide-react";

export default function NetworkStatus() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("Just now");

  const triggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync("10:24 AM");
    }, 800);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Edge Offline/Online Indicator */}
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
        <HardDrive className="w-3.5 h-3.5 text-teal-400" />
        <span className="text-[11px]">Edge AI Engine:</span>
        <span className="font-semibold text-teal-400">Offline-Ready</span>
      </div>

      {/* Cloud Sync Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline text-[11px]">Nodal Hospital Sync:</span>
        <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Online
        </span>
        <button
          onClick={triggerSync}
          title="Force sync local records to District Hospital EMR"
          className="ml-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin text-teal-400" : ""}`} />
        </button>
      </div>
    </div>
  );
}
