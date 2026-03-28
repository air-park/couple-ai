"use client";

import { useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

interface PaymentButtonProps {
  sessionId: string;
  onError?: (msg: string) => void;
}

export function PaymentButton({ sessionId, onError }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      // 1. 주문 생성
      const checkoutRes = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const checkout = await checkoutRes.json();
      if (!checkoutRes.ok) {
        onError?.(checkout.error || "결제 준비 중 오류가 발생했습니다.");
        return;
      }

      const { orderId, amount } = checkout;

      // 2. Toss 결제 요청
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        onError?.("결제 설정이 올바르지 않습니다.");
        return;
      }

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName: "커플 갈등 전체 분석",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: undefined,
        customerName: undefined,
      });
      // requestPayment는 페이지를 리다이렉트하므로 이후 코드는 실행되지 않음
    } catch (err) {
      const msg = err instanceof Error ? err.message : "결제 요청 중 오류가 발생했습니다.";
      onError?.(msg);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold py-4 rounded-2xl transition-colors text-sm shadow-sm"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          결제 준비 중...
        </span>
      ) : (
        "전체 의견 열어보기 · 3,900원"
      )}
    </button>
  );
}
