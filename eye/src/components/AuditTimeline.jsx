import React from "react";
import { History, Clock, CheckCircle2, ShieldCheck, User } from "lucide-react";

export default function AuditTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-900">
            Case Activity & Audit Timeline
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Screening record only
        </span>
      </div>

      <div className="relative pl-4 space-y-3 before:content-[''] before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-200">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative text-xs">
            <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-slate-900 text-[11px]">{item.action}</span>
              <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
              <span className="text-teal-800 font-medium">{item.actor}</span>
              {item.note && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 italic">{item.note}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
