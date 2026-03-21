import { getModelByTier, type Tier } from "@/lib/ai-models";
import { callOpenAI, safeParseJSON } from "@/lib/openai";
import { FREE_SYSTEM_PROMPT } from "@/lib/prompts/free-analysis";
import { PAID_SYSTEM_PROMPT } from "@/lib/prompts/paid-analysis";

// ── Types ──────────────────────────────────────────────────────────────────

export interface FreePersona {
  name: string;
  emoji: string;
  responsibilityA: number;
  responsibilityB: number;
  oneLineVerdict: string;
  triggerLine: string;
  why: string;
  summary: string;
}

export interface PaidPersona extends FreePersona {
  reconciliation: string;
}

export interface FreeAnalysisResult {
  tier: "free";
  persona: FreePersona;
}

export interface PaidAnalysisResult {
  tier: "paid";
  personas: PaidPersona[];
  misunderstanding: string;
  finalMediatorComment: string;
}

export type AnalysisResult = FreeAnalysisResult | PaidAnalysisResult;

// ── Validators ─────────────────────────────────────────────────────────────

function validateFreePersona(data: unknown): FreePersona {
  const d = data as Record<string, unknown>;
  if (
    typeof d.name !== "string" ||
    typeof d.emoji !== "string" ||
    typeof d.responsibilityA !== "number" ||
    typeof d.responsibilityB !== "number" ||
    typeof d.oneLineVerdict !== "string" ||
    typeof d.triggerLine !== "string" ||
    typeof d.why !== "string" ||
    typeof d.summary !== "string"
  ) {
    throw new Error("무료 분석 응답 구조가 올바르지 않습니다.");
  }
  return d as unknown as FreePersona;
}

function validatePaidResult(data: unknown): Omit<PaidAnalysisResult, "tier"> {
  const d = data as Record<string, unknown>;
  if (
    !Array.isArray(d.personas) ||
    typeof d.misunderstanding !== "string" ||
    typeof d.finalMediatorComment !== "string"
  ) {
    throw new Error("유료 분석 응답 구조가 올바르지 않습니다.");
  }
  return d as unknown as Omit<PaidAnalysisResult, "tier">;
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conversation: string = body.conversation;
    const tier: Tier = body.tier === "paid" ? "paid" : "free";

    if (!conversation || typeof conversation !== "string" || conversation.trim().length === 0) {
      return Response.json({ error: "대화 내용을 입력해주세요." }, { status: 400 });
    }
    if (conversation.trim().length > 3000) {
      return Response.json({ error: "대화 내용이 너무 깁니다. 3000자 이내로 줄여주세요." }, { status: 400 });
    }

    const model = getModelByTier(tier);
    const userMessage = `다음 커플 갈등 대화를 분석해주세요:\n\n${conversation}`;

    if (tier === "free") {
      const raw = await callOpenAI(model, FREE_SYSTEM_PROMPT, userMessage);
      const parsed = safeParseJSON<unknown>(raw);
      const persona = validateFreePersona(parsed);
      const result: FreeAnalysisResult = { tier: "free", persona };
      return Response.json(result);
    } else {
      const raw = await callOpenAI(model, PAID_SYSTEM_PROMPT, userMessage);
      const parsed = safeParseJSON<unknown>(raw);
      const { personas, misunderstanding, finalMediatorComment } = validatePaidResult(parsed);
      const result: PaidAnalysisResult = { tier: "paid", personas, misunderstanding, finalMediatorComment };
      return Response.json(result);
    }
  } catch (error) {
    console.error("Analysis error:", error);
    const raw = error instanceof Error ? error.message : "";
    // Sanitize: don't expose raw OpenAI API response body to client
    const message = raw.startsWith("OpenAI API 오류") || raw.startsWith("OpenAI Vision")
      ? "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      : raw || "분석 중 오류가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
