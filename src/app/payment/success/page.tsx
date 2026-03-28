"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"confirming" | "error">("confirming");
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        const data = await res.json();
        if (!res.ok || !data.sessionId) {
          setStatus("error");
          setErrorMsg(data.error || "결제 확인 중 오류가 발생했습니다.");
          return;
        }
        router.replace(`/result/${data.sessionId}`);
      } catch {
        setStatus("error");
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    })();
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">결제 처리 오류</h1>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => router.replace("/")}
            className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-2xl"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <span className="w-7 h-7 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin block" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">결제 확인 중...</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          AI 패널이 분석을 시작했습니다.<br />잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessInner />
    </Suspense>
  );
}
