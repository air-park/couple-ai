import { notFound } from "next/navigation";
import { createServiceSupabase } from "@/lib/supabase-server";
import type { PaidPersona } from "@/app/api/analyze/route";
import type { Json } from "@/types/database";

// ── Types ──────────────────────────────────────────────────────────────────

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function PersonaCard({ persona, index, total }: { persona: PaidPersona; index: number; total: number }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100/80">
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-lg shrink-0">
            {persona.emoji}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest leading-none mb-0.5">
              패널 {index + 1}
            </p>
            <p className="text-sm font-bold text-gray-900">{persona.name}</p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-gray-300 bg-gray-50 px-2.5 py-1 rounded-full">
          {index + 1} / {total}
        </span>
      </div>

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
          <div className="bg-blue-400" style={{ width: `${persona.responsibilityA}%` }} />
          <div className="bg-rose-400" style={{ width: `${persona.responsibilityB}%` }} />
        </div>
      </div>

      <div className="px-6 py-5 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">패널 의견</p>
        <p className="text-gray-800 font-semibold text-sm leading-relaxed">{persona.oneLineVerdict}</p>
      </div>

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

      <div className={`px-6 py-4 ${persona.reconciliation ? "border-b border-gray-50" : ""}`}>
        <p className="text-gray-400 text-xs leading-relaxed">{persona.summary}</p>
      </div>

      {persona.reconciliation && (
        <div className="px-6 py-4 bg-green-50/40">
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-1.5">
            화해 추천
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">&ldquo;{persona.reconciliation}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;

  const db = createServiceSupabase();

  const { data: result, error } = await db
    .from("analysis_results")
    .select("persona_results, misunderstanding, final_mediator_comment, tier, created_at")
    .eq("session_id", id)
    .eq("tier", "paid")
    .single();

  if (error || !result) {
    notFound();
  }

  const personas = result.persona_results as unknown as PaidPersona[];
  const misunderstanding = result.misunderstanding ?? "";
  const finalMediatorComment = result.final_mediator_comment ?? "";

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-rose-50/60 via-rose-50/20 to-transparent pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-6 pt-16 pb-24">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white border border-rose-100 shadow-sm text-rose-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            전체 분석 결과
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-snug">
            5명 패널의 시각
          </h1>
          <p className="text-xs text-gray-400 mt-1">AI 패널의 참고 의견이에요</p>
        </div>

        {/* Persona cards */}
        <div className="space-y-4">
          {personas.map((persona, i) => (
            <PersonaCard key={i} persona={persona} index={i} total={personas.length} />
          ))}
        </div>

        {/* Misunderstanding */}
        {misunderstanding && (
          <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-[0_2px_24px_rgba(0,0,0,0.05)] px-6 py-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              핵심 오해
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">{misunderstanding}</p>
          </div>
        )}

        {/* Final mediator comment */}
        {finalMediatorComment && (
          <div className="mt-3 bg-rose-50/60 rounded-3xl border border-rose-100/80 px-6 py-5">
            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-2">
              AI Mediator 종합 코멘트
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">{finalMediatorComment}</p>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10 text-center">
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            새 대화 분석하기 →
          </a>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: ResultPageProps) {
  const { id } = await params;
  return {
    title: "전체 분석 결과 · AI 갈등 패널",
    description: "5명의 AI 패널이 분석한 커플 갈등 결과입니다.",
    openGraph: {
      title: "우리 싸움, AI 패널의 시각",
      description: "5명의 AI 패널이 다른 시각으로 분석한 결과를 확인하세요.",
      url: `/result/${id}`,
    },
  };
}
