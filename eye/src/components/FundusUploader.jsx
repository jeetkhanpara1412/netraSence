import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle, RefreshCw, Check } from "lucide-react";

export default function FundusUploader({
  selectedPreset,
  onSelectPreset,
  onCustomFileUpload,
  isAnalyzing,
  currentImage
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const presets = [
    {
      key: "MODERATE_NPDR",
      label: "Moderate NPDR",
      sub: "Level 2 • Exudates & MAs",
      tag: "Referable",
      tagColor: "bg-amber-100 text-amber-800 border-amber-300"
    },
    {
      key: "SEVERE_NPDR",
      label: "Severe NPDR",
      sub: "Level 3 • 4-Quadrant Blot Hemorrhages",
      tag: "Urgent",
      tagColor: "bg-rose-100 text-rose-800 border-rose-300"
    },
    {
      key: "NORMAL",
      label: "Normal Retina",
      sub: "Level 0 • Clear Macula & Disc",
      tag: "Non-Referable",
      tagColor: "bg-emerald-100 text-emerald-800 border-emerald-300"
    },
    {
      key: "UNGRADABLE_BLURRED",
      label: "Ungradable Defocus",
      sub: "Quality <40% • Motion blur & haze",
      tag: "Recapture",
      tagColor: "bg-slate-200 text-slate-800 border-slate-300"
    }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid fundus image file (JPEG, PNG, TIFF).");
      return;
    }
    onCustomFileUpload(file);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs mb-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Fundus Camera Input</h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          45° Posterior Pole
        </span>
      </div>

      {/* Preset Fast-Pickers for SIH Presentation Judges */}
      <div className="mb-2.5">
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Select Clinical Case Preset (Instant Presentation Mode):
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const isSelected = selectedPreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onSelectPreset(preset.key)}
                disabled={isAnalyzing}
                className={`p-2 rounded-lg border text-left transition-all relative ${
                  isSelected
                    ? "bg-teal-50/90 border-teal-500 ring-2 ring-teal-500/20"
                    : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-bold truncate ${isSelected ? "text-teal-900" : "text-slate-800"}`}>
                    {preset.label}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded border font-semibold shrink-0 ml-1 ${preset.tagColor}`}>
                    {preset.tag}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{preset.sub}</p>
                {isSelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-teal-500 bg-teal-50/50"
            : "border-slate-300 hover:border-teal-400 bg-slate-50/60 hover:bg-slate-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          disabled={isAnalyzing}
        />
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-800">
              Drop fundus file or <span className="text-teal-600 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Forus 3nethra, Remidio, Topcon DICOM/JPEG
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
