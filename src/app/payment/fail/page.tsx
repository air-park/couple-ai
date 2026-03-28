"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PaymentFailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">😔</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">{message}</p>
        <button
          onClick={() => router.replace("/")}
          className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-2xl"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailInner />
    </Suspense>
  );
}
