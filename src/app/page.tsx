"use client";

import { useState } from "react";
import type {
  AnalysisResult,
  FreePersona,
  PaidPersona,
  PaidAnalysisResult,
} from "./api/analyze/route";
import { ImageUploadFlow } from "@/components/ImageUploadFlow";

// ── Static data ────────────────────────────────────────────────────────────

const FEATURES = [
  { emoji: "🔍", title: "실제 대화를 분석합니다", desc: "문장 흐름과 표현을 기반으로 읽어냅니다." },
  { emoji: "👥", title: "다양한 시각으로 봅니다", desc: "5명의 AI 패널이 각자 다르게 해석합니다." },
  { emoji: "⚡", title: "갈등 키운 문장을 짚습니다", desc: "감정이 어디서 틀어졌는지 바로 확인합니다." },
  { emoji: "🤝", title: "화해 방향도 제안합니다", desc: "누가 아쉬웠는지와 어떻게 풀지 함께 봅니다." },
];

const LOCKED_TEASERS = [
  { name: "옆집 50대 아저씨", emoji: "👨", teaser: "말이 세진 순간부터 서로 물러서지 못한 것 같네요." },
  { name: "커플 전문 상담가", emoji: "💑", teaser: "인정받고 싶은 마음의 충돌로 보여요." },
  { name: "AI Mediator", emoji: "🤖", teaser: "어디서 어긋났는지가 더 분명히 보여요." },
  { name: "친구", emoji: "🧑‍🤝‍🧑", teaser: "이 장면은 한쪽이 좀 얄밉게 들렸을 것 같아." },
];

const PLACEHOLDER = `A: 왜 또 늦어? 맨날 이렇게 늦잖아
B: 나도 일이 있었거든? 항상 이해를 못 해
A: 내가 언제 이해를 못 했어
B: 지난번에도 그랬잖아`;

// ── Shared persona card ────────────────────────────────────────────────────

function PersonaCard({
  persona,
  index,
  total,
}: {
  persona: FreePersona | PaidPersona;
  index?: number;
  total?: number;
}) {
  const reconciliation = (persona as PaidPersona).reconciliation ?? null;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100/80">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-lg shrink-0">
            {persona.emoji}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest leading-none mb-0.5">
              {index !== undefined ? `패널 ${index + 1}` : "첫 인상 분석"}
            </p>
            <p className="text-sm font-bold text-gray-900">{persona.name}</p>
          </div>
        </div>
        {index !== undefined && total !== undefined && (
          <span className="text-[11px] font-medium text-gray-300 bg-gray-50 px-2.5 py-1 rounded-full">
            {index + 1} / {total}
          </span>
        )}
      </div>

      {/* Score */}
      <div className="px-6 pb-5 border-b border-gray-50">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-3xl font-extrabold text-blue-500 leading-none tabular-nums">
              {persona.responsibilityA}
            </span>
            <span className="text-sm font-bold text-blue-400 ml-0.5">%</span>
            <p className="text-xs text-gray-400 mt-1">A</p>
          </div>
          <p className="text-[10px] text-gray-300 pb-2 tracking-wide">이번 장면 기준</p>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-rose-500 leading-none tabular-nums">
              {persona.responsibilityB}
            </span>
            <span className="text-sm font-bold text-rose-400 ml-0.5">%</span>
            <p className="text-xs text-gray-400 mt-1 text-right">B</p>
          </div>
        </div>
        <div className="flex rounded-full overflow-hidden h-2.5 bg-gray-100">
          <div className="bg-blue-400 transition-all duration-700" style={{ width: `${persona.responsibilityA}%` }} />
          <div className="bg-rose-400 transition-all duration-700" style={{ width: `${persona.responsibilityB}%` }} />
        </div>
      </div>

      {/* Verdict */}
      <div className="px-6 py-5 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">패널 의견</p>
        <p className="text-gray-800 font-semibold text-sm leading-relaxed">{persona.oneLineVerdict}</p>
      </div>

      {/* Trigger */}
      <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/60">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
          마음을 더 상하게 한 말
        </p>
        <div className="flex items-start gap-2 mb-2">
          <span className="text-rose-300 text-lg leading-none mt-0.5 shrink-0">&ldquo;</span>
          <p className="text-gray-800 font-bold text-sm leading-relaxed">{persona.triggerLine}</p>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed pl-5">{persona.why}</p>
      </div>

      {/* Summary */}
      <div className={`px-6 py-4 ${reconciliation ? "border-b border-gray-50" : ""}`}>
        <p className="text-gray-400 text-xs leading-relaxed">{persona.summary}</p>
      </div>

      {/* Reconciliation (paid only) */}
      {reconciliation && (
        <div className="px-6 py-4 bg-green-50/40">
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-1.5">
            화해 추천
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">&ldquo;{reconciliation}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

function LockedRow({ name, emoji, teaser }: { name: string; emoji: string; teaser: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
      <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center text-sm shrink-0 opacity-50">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 leading-none mb-0.5">{name}</p>
        <p className="text-xs text-gray-300 truncate">{teaser}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-200">🔒</span>
        <span className="text-xs font-semibold text-rose-400">보기</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [conversation, setConversation] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze(text: string, tier: "free" | "paid") {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: text, tier }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "오류가 발생했습니다."); return; }
      setResult(data as AnalysisResult);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!conversation.trim()) return;
    analyze(conversation, "free");
  }

  function handleImageConfirm(text: string) {
    analyze(text, "paid");
  }

  function reset() {
    setResult(null);
    setConversation("");
    setError("");
    setInputMode("text");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-rose-50/60 via-rose-50/20 to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6">

        {/* ── Hero ── */}
        <div className="text-center pt-20 pb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-rose-100 shadow-sm text-rose-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            AI 갈등 패널 · 베타
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-5">
            우리 싸움,<br />
            <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              누구 잘못일까?
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
            싸운 대화를 붙여넣으면 AI 패널이<br />
            각자 다른 시각으로 분석합니다.
          </p>
        </div>

        {!result ? (
          <>
            {/* ── Input form ── */}
            <div className="max-w-lg mx-auto pb-20">

              {/* Tab toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
                <button
                  onClick={() => setInputMode("text")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    inputMode === "text"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  텍스트 입력
                </button>
                <button
                  onClick={() => setInputMode("image")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    inputMode === "image"
                      ? "bg-white shadow-sm text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  이미지 업로드
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-50 px-1.5 py-0.5 rounded-full leading-tight">
                    PRO
                  </span>
                </button>
              </div>

              {inputMode === "text" ? (
                <form onSubmit={handleTextSubmit} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={conversation}
                      onChange={(e) => setConversation(e.target.value.slice(0, 2000))}
                      placeholder={PLACEHOLDER}
                      rows={8}
                      className="w-full resize-none rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm p-5 pb-8 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all leading-relaxed shadow-sm"
                    />
                    <span className={`absolute bottom-3 right-4 text-[10px] tabular-nums ${conversation.length >= 1800 ? "text-rose-400" : "text-gray-300"}`}>
                      {conversation.length}/2000
                    </span>
                  </div>
                  {error && <p className="text-red-400 text-sm px-1">{error}</p>}
                  <p className="text-xs text-gray-400 px-1">A, B 또는 이름을 넣으면 더 정확해요</p>
                  <button
                    type="submit"
                    disabled={loading || !conversation.trim()}
                    className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-300 text-white font-semibold py-4 rounded-2xl transition-all text-sm shadow-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        분석 중...
                      </span>
                    ) : "갈등 분석하기 →"}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 px-1 text-center">
                    복붙 없이 캡처만 올리세요 · 전체 5패널 분석 제공
                  </p>
                  <ImageUploadFlow onConfirm={handleImageConfirm} analyzing={loading} />
                  {error && <p className="text-red-400 text-sm px-1">{error}</p>}
                </div>
              )}
            </div>

            {/* ── Features ── */}
            <div className="border-t border-gray-100 pt-16 pb-24">
              <p className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-12">
                단순 테스트가 아닌 이유
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((f) => (
                  <div key={f.emoji} className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-lg">
                      {f.emoji}
                    </div>
                    <p className="text-sm font-bold text-gray-800 leading-snug">{f.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : result.tier === "free" ? (
          /* ── Free result ── */
          <div className="max-w-sm mx-auto pb-24">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-gray-400">AI 패널의 참고 의견이에요</p>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← 다시 분석
              </button>
            </div>

            <PersonaCard persona={result.persona} />

            <div className="mt-3 space-y-2">
              {LOCKED_TEASERS.map((p) => (
                <LockedRow key={p.name} {...p} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-xs text-gray-400 mb-4">나머지 4개 패널의 시각이 궁금하다면</p>
              <button className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm shadow-sm">
                전체 의견 열어보기
              </button>
            </div>
          </div>
        ) : (
          /* ── Paid result ── */
          <PaidResult result={result as PaidAnalysisResult} onReset={reset} />
        )}

      </div>
    </div>
  );
}

// ── Paid result view ───────────────────────────────────────────────────────

function PaidResult({
  result,
  onReset,
}: {
  result: PaidAnalysisResult;
  onReset: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest">전체 분석 결과</p>
          <p className="text-xs text-gray-400 mt-0.5">5명 패널의 참고 의견이에요</p>
        </div>
        <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← 다시 분석
        </button>
      </div>

      {/* All persona cards */}
      <div className="space-y-4">
        {result.personas.map((persona, i) => (
          <PersonaCard
            key={persona.name}
            persona={persona}
            index={i}
            total={result.personas.length}
          />
        ))}
      </div>

      {/* Misunderstanding */}
      <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_24px_rgba(0,0,0,0.05)] px-6 py-5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          핵심 오해
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">{result.misunderstanding}</p>
      </div>

      {/* Final mediator comment */}
      <div className="mt-3 bg-rose-50/60 rounded-3xl border border-rose-100/80 px-6 py-5">
        <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-2">
          AI Mediator 종합 코멘트
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">{result.finalMediatorComment}</p>
      </div>

      <button
        onClick={onReset}
        className="mt-10 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-2"
      >
        다시 분석하기
      </button>
    </div>
  );
}
