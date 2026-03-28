import { getModelByTier } from "@/lib/ai-models";
import { callOpenAI, safeParseJSON } from "@/lib/openai";
import { PAID_SYSTEM_PROMPT } from "@/lib/prompts/paid-analysis";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import type { PaidPersona } from "@/app/api/analyze/route";

// ── Toss 결제 승인 ──────────────────────────────────────────────────────────

async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; method?: string; error?: string }> {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  }

  const credentials = Buffer.from(`${secretKey}:`).toString("base64");

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.message ?? "결제 승인 실패" };
  }

  return { success: true, method: data.method ?? "" };
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentKey: string = body.paymentKey;
    const orderId: string = body.orderId;
    const amount: number = Number(body.amount);

    if (!paymentKey || !orderId || !amount) {
      return Response.json({ error: "결제 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (amount !== 3900) {
      return Response.json({ error: "결제 금액이 올바르지 않습니다." }, { status: 400 });
    }

    const db = createServiceSupabase();

    // 주문 기록 조회
    const { data: payment, error: paymentFetchError } = await db
      .from("payments")
      .select("id, session_id, status")
      .eq("toss_order_id", orderId)
      .single();

    if (paymentFetchError || !payment) {
      return Response.json({ error: "주문 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (payment.status === "paid") {
      // 이미 처리됨 — 세션 ID 반환
      return Response.json({ sessionId: payment.session_id });
    }

    if (payment.status !== "pending") {
      return Response.json({ error: "처리할 수 없는 결제 상태입니다." }, { status: 400 });
    }

    // Toss 결제 승인 요청
    const tossResult = await confirmTossPayment(paymentKey, orderId, amount);

    if (!tossResult.success) {
      await db
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);
      return Response.json({ error: tossResult.error ?? "결제 승인에 실패했습니다." }, { status: 400 });
    }

    // 결제 상태 업데이트
    await db.from("payments").update({
      status: "paid",
      toss_payment_key: paymentKey,
      payment_method: tossResult.method ?? null,
      paid_at: new Date().toISOString(),
    }).eq("id", payment.id);

    const sessionId = payment.session_id!;

    // 세션에서 대화 내용 가져오기
    const { data: session, error: sessionError } = await db
      .from("conversation_sessions")
      .select("raw_input")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session?.raw_input) {
      return Response.json({ error: "대화 내용을 불러올 수 없습니다." }, { status: 500 });
    }

    const conversation = session.raw_input;

    // 유료 AI 분석 실행
    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const model = getModelByTier("paid");
    const userMessage = `다음 커플 갈등 대화를 분석해주세요:\n\n${conversation}`;
    const raw = await callOpenAI(model, PAID_SYSTEM_PROMPT, userMessage);
    const parsed = safeParseJSON<{
      personas: PaidPersona[];
      misunderstanding: string;
      finalMediatorComment: string;
    }>(raw);

    const { personas, misunderstanding, finalMediatorComment } = parsed;

    // 분석 결과 저장
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

    // user_id 세션에 연결 (로그인 사용자라면)
    if (user?.id) {
      await db
        .from("conversation_sessions")
        .update({ user_id: user.id })
        .eq("id", sessionId)
        .is("user_id", null);
    }

    return Response.json({ sessionId });
  } catch (error) {
    console.error("Payment confirm error:", error);
    const msg = error instanceof Error ? error.message : "";
    const userMessage =
      msg.startsWith("OpenAI") ? "AI 분석 중 오류가 발생했습니다." : "결제 처리 중 오류가 발생했습니다.";
    return Response.json({ error: userMessage }, { status: 500 });
  }
}
