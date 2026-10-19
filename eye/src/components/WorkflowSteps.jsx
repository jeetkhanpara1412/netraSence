import React from "react";
import { Upload, CheckSquare, Cpu, UserCheck, FileCheck } from "lucide-react";

export default function WorkflowSteps({ currentStep = "Upload", isUngradable = false }) {
  const steps = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "quality", label: "Quality Check", icon: CheckSquare },
    { id: "ai", label: "AI Analysis", icon: Cpu },
    { id: "review", label: "Doctor Review", icon: UserCheck },
    { id: "report", label: "Report", icon: FileCheck },
  ];

  const getStepIndex = (stepName) => {
    switch (stepName) {
      case "Upload": return 0;
      case "Quality Check": return 1;
      case "AI Analysis": return 2;
      case "Doctor Review": return 3;
      case "Report": return 4;
      default: return 0;
    }
  };

  const activeIdx = getStepIndex(currentStep);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs mb-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5 px-1">
        <span className="flex items-center gap-1.5 text-slate-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
          Clinical Screening Workflow Pipeline:
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Step {activeIdx + 1} of {steps.length} • {steps[activeIdx]?.label}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isPassed = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          let stateClass = "bg-slate-50 border-slate-200 text-slate-400";
          let iconClass = "text-slate-400";

          if (isPassed) {
            stateClass = "bg-emerald-50/80 border-emerald-300 text-emerald-800 font-medium";
            iconClass = "text-emerald-600";
          } else if (isCurrent) {
            if (isUngradable && (step.id === "quality" || step.id === "ai")) {
              stateClass = "bg-amber-50 border-amber-400 text-amber-900 font-bold ring-2 ring-amber-300";
              iconClass = "text-amber-600";
            } else {
              stateClass = "bg-teal-50 border-teal-500 text-teal-900 font-bold ring-2 ring-teal-400";
              iconClass = "text-teal-700";
            }
          }

          return (
            <div
              key={step.id}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-center transition-all ${stateClass}`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
              <span className="text-xs tracking-tight font-semibold">
                <span className="font-mono text-[10px] mr-1 opacity-70">0{idx + 1}.</span>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
