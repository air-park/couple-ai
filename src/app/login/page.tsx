"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "kakao" | null>(null);

  async function signIn(provider: "google" | "kakao") {
    setLoading(provider);
    const supabase = createClient();

    const next =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next") ?? "/"
        : "/";

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            AI 갈등 패널
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            계속하려면 로그인하세요
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            로그인하면 분석 결과가 저장되고<br />
            이어지는 상담이 가능해요
          </p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={() => signIn("google")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-semibold py-3.5 rounded-2xl transition-colors shadow-sm text-sm"
          >
            {loading === "google" ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Google로 로그인
          </button>

          {/* Kakao */}
          <button
            onClick={() => signIn("kakao")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#F0D800] disabled:opacity-60 text-[#191919] font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            {loading === "kakao" ? (
              <span className="w-4 h-4 border-2 border-yellow-600 border-t-yellow-900 rounded-full animate-spin" />
            ) : (
              <KakaoIcon />
            )}
            카카오로 로그인
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-8 leading-relaxed">
          로그인하면 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주합니다
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.91 1 7.5c0 2.29 1.52 4.306 3.816 5.496L3.9 16.166a.25.25 0 00.366.278L8.04 13.92c.317.03.638.046.96.046 4.418 0 8-2.91 8-6.5S13.418 1 9 1z" fill="#191919"/>
    </svg>
  );
}
