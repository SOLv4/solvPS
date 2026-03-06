"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/dashboard",
      },
      {
        onSuccess: () => {
          window.location.href = "/dashboard";
        },
        onError: (ctx) => {
          alert(ctx.error.message || "로그인에 실패했습니다.");
          setLoading(false);
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0B1120] to-[#0F1F3D] p-6">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#0F46D8]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#0F46D8]/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* 브랜드 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-white">Solv</span><span className="text-[#4F8EFF]">PS</span>
          </h1>
          <p className="mt-2 text-sm text-white/40">코딩테스트 로드맵 플랫폼</p>
        </div>

        {/* 카드 */}
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl">
          <h2 className="mb-6 text-lg font-bold text-gray-900">로그인</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                이메일
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSignIn()}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F46D8]/50 focus:bg-white focus:ring-2 focus:ring-[#0F46D8]/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSignIn()}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F46D8]/50 focus:bg-white focus:ring-2 focus:ring-[#0F46D8]/10"
              />
            </div>
            <button
              onClick={() => void handleSignIn()}
              disabled={loading || !email || !password}
              className="mt-2 w-full rounded-xl bg-[#0F46D8] py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-[#0A3DC0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인하기"}
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#0F46D8] hover:text-[#0A3DC0]"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
