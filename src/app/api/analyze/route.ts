import { getModelByTier, type Tier } from "@/lib/ai-models";
import { callOpenAI, safeParseJSON } from "@/lib/openai";
import { FREE_SYSTEM_PROMPT } from "@/lib/prompts/free-analysis";
import { PAID_SYSTEM_PROMPT } from "@/lib/prompts/paid-analysis";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";

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
  sessionId: string;
}

export interface PaidAnalysisResult {
  tier: "paid";
  personas: PaidPersona[];
  misunderstanding: string;
  finalMediatorComment: string;
  sessionId: string;
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

function validatePaidResult(data: unknown): Omit<PaidAnalysisResult, "tier" | "sessionId"> {
  const d = data as Record<string, unknown>;
  if (
    !Array.isArray(d.personas) ||
    typeof d.misunderstanding !== "string" ||
    typeof d.finalMediatorComment !== "string"
  ) {
    throw new Error("유료 분석 응답 구조가 올바르지 않습니다.");
  }
  return d as unknown as Omit<PaidAnalysisResult, "tier" | "sessionId">;
}

// ── Message Parser ─────────────────────────────────────────────────────────

function parseMessages(text: string, sessionId: string) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return lines
    .map((line, i) => {
      const match = line.match(/^([A-Za-z가-힣]{1,15})\s*:\s*(.+)/);
      return {
        session_id: sessionId,
        speaker_label: match ? match[1] : "narrator",
        original_text: match ? match[2].trim() : line.trim(),
        source_type: "typed" as const,
        message_order: i,
      };
    })
    .filter((m) => m.original_text.length > 0);
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conversation: string = body.conversation;
    const tier: Tier = body.tier === "paid" ? "paid" : "free";
    const existingSessionId: string | undefined = body.sessionId;

    if (!conversation || typeof conversation !== "string" || conversation.trim().length === 0) {
      return Response.json({ error: "대화 내용을 입력해주세요." }, { status: 400 });
    }
    if (conversation.trim().length > 3000) {
      return Response.json({ error: "대화 내용이 너무 깁니다. 3000자 이내로 줄여주세요." }, { status: 400 });
    }

    // 로그인 사용자 확인
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const db = createServiceSupabase();

    // 세션 생성 또는 기존 세션 재사용
    let sessionId = existingSessionId;
    if (!sessionId) {
      const { data: session, error: sessionError } = await db
        .from("conversation_sessions")
        .insert({
          user_id: user?.id ?? null,
          input_type: "text",
          raw_input: conversation,
          status: "analyzing",
        })
        .select("id")
        .single();

      if (sessionError || !session) {
        console.error("Session creation error:", sessionError);
        // DB 오류는 분석 자체를 막지 않음
      } else {
        sessionId = session.id;

        // 메시지 파싱 및 저장
        const messages = parseMessages(conversation, session.id);
        if (messages.length > 0) {
          await db.from("messages").insert(messages);
        }
      }
    }

    // OpenAI 분석 실행
    const model = getModelByTier(tier);
    const userMessage = `다음 커플 갈등 대화를 분석해주세요:\n\n${conversation}`;

    if (tier === "free") {
      const raw = await callOpenAI(model, FREE_SYSTEM_PROMPT, userMessage);
      const parsed = safeParseJSON<unknown>(raw);
      const persona = validateFreePersona(parsed);

      // 결과 저장
      if (sessionId) {
        await db.from("analysis_results").upsert(
          {
            session_id: sessionId,
            tier: "free",
            model_used: model,
            persona_results: [persona] as unknown as import("@/types/database").Json,
          },
          { onConflict: "session_id,tier" }
        );
        await db
          .from("conversation_sessions")
          .update({ status: "analyzed", analyzed_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      const result: FreeAnalysisResult = {
        tier: "free",
        persona,
        sessionId: sessionId ?? "",
      };
      return Response.json(result);
    } else {
      const raw = await callOpenAI(model, PAID_SYSTEM_PROMPT, userMessage);
      const parsed = safeParseJSON<unknown>(raw);
      const { personas, misunderstanding, finalMediatorComment } = validatePaidResult(parsed);

      // 결과 저장
      if (sessionId) {
        await db.from("analysis_results").upsert(
          {
            session_id: sessionId,
            tier: "paid",
            model_used: model,
            persona_results: personas as unknown as import("@/types/database").Json,
            misunderstanding,
            final_mediator_comment: finalMediatorComment,
          },
          { onConflict: "session_id,tier" }
        );
        await db
          .from("conversation_sessions")
          .update({ status: "analyzed", analyzed_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      const result: PaidAnalysisResult = {
        tier: "paid",
        personas,
        misunderstanding,
        finalMediatorComment,
        sessionId: sessionId ?? "",
      };
      return Response.json(result);
    }
  } catch (error) {
    console.error("Analysis error:", error);
    const raw = error instanceof Error ? error.message : "";
    const message =
      raw.startsWith("OpenAI API 오류") || raw.startsWith("OpenAI Vision")
        ? "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        : raw || "분석 중 오류가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
