"use client";

import { useState, useRef } from "react";

type UploadStep = "upload" | "extracting" | "confirming";

interface Props {
  onConfirm: (text: string) => void;
  analyzing?: boolean;
}

export function ImageUploadFlow({ onConfirm, analyzing }: Props) {
  const [step, setStep] = useState<UploadStep>("upload");
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("5MB 이하 이미지만 업로드 가능합니다.");
      return;
    }

    setStep("extracting");
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "텍스트 추출에 실패했습니다.");

      setExtractedText(data.text);
      setStep("confirming");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      setStep("upload");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function reset() {
    setStep("upload");
    setExtractedText("");
    setError("");
  }

  // ── Extracting ──────────────────────────────────────────────────────────

  if (step === "extracting") {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-rose-300 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-gray-700">대화 읽는 중...</p>
        <p className="text-xs text-gray-400">AI가 이미지에서 텍스트를 추출하고 있어요</p>
      </div>
    );
  }

  // ── Confirming ──────────────────────────────────────────────────────────

  if (step === "confirming") {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">이렇게 읽었어요</p>
            <p className="text-xs text-gray-400 mt-0.5">잘못 읽힌 부분이 있으면 직접 수정해주세요</p>
          </div>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            rows={8}
            className="w-full resize-none p-5 text-sm text-gray-700 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            disabled={analyzing}
            className="px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 font-semibold py-3.5 rounded-2xl text-sm transition-colors shrink-0"
          >
            다시 올리기
          </button>
          <button
            onClick={() => onConfirm(extractedText)}
            disabled={!extractedText.trim() || analyzing}
            className="flex-1 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-300 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                전체 분석 중...
              </span>
            ) : "전체 분석하기 →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Upload ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-10 text-center cursor-pointer hover:border-rose-200 hover:bg-rose-50/30 transition-all"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <p className="text-3xl mb-3">📸</p>
        <p className="text-sm font-semibold text-gray-700 mb-1">카톡 캡처를 올려주세요</p>
        <p className="text-xs text-gray-400">JPG, PNG · 최대 5MB · 드래그도 됩니다</p>
      </div>

      {error && <p className="text-red-400 text-sm px-1">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
