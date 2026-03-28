import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";

// orderId: 토스가 요구하는 6~64자 영숫자 + - _ 조합
function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `COUPLE-${ts}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId: string | undefined = body.sessionId;

    if (!sessionId) {
      return Response.json({ error: "sessionId가 필요합니다." }, { status: 400 });
    }

    const serverSupabase = await createServerSupabase();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const db = createServiceSupabase();

    // 세션 존재 확인
    const { data: session, error: sessionError } = await db
      .from("conversation_sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "유효하지 않은 세션입니다." }, { status: 404 });
    }

    // 이미 paid 결과가 있으면 재결제 불필요
    const { data: existingResult } = await db
      .from("analysis_results")
      .select("id")
      .eq("session_id", sessionId)
      .eq("tier", "paid")
      .single();

    if (existingResult) {
      return Response.json({ error: "이미 전체 분석이 완료된 세션입니다." }, { status: 409 });
    }

    const orderId = generateOrderId();

    // 결제 레코드 생성 (pending 상태)
    const { error: paymentError } = await db.from("payments").insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      toss_order_id: orderId,
      amount: 3900,
      status: "pending",
    });

    if (paymentError) {
      console.error("Payment record creation error:", paymentError);
      return Response.json({ error: "결제 준비 중 오류가 발생했습니다." }, { status: 500 });
    }

    return Response.json({ orderId, amount: 3900 });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ error: "결제 준비 중 오류가 발생했습니다." }, { status: 500 });
  }
}
