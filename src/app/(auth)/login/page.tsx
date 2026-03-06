"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
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
          console.error("Login error:", ctx.error);
          alert(ctx.error.message || "로그인에 실패했습니다.");
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060d1f] px-4">
      {/* 배경 그라디언트 오브 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#0F46D8]/25 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#4F8EFF]/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F46D8]/10 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-white">Solv</span>
            <span className="text-[#4F8EFF]">PS</span>
          </h1>
          <p className="mt-2 text-sm text-white/40">코딩테스트 로드맵 플랫폼</p>
        </div>

        {/* 글래스 카드 */}
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.06] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h2 className="mb-6 text-lg font-semibold text-white">로그인</h2>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/[0.12] bg-white/[0.08] px-3.5 py-2.5 text-sm text-white outline-none backdrop-blur-sm transition-all placeholder:text-white/30 focus:border-[#4F8EFF]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#4F8EFF]/15"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSignIn(); }}
              className="w-full rounded-xl border border-white/[0.12] bg-white/[0.08] px-3.5 py-2.5 text-sm text-white outline-none backdrop-blur-sm transition-all placeholder:text-white/30 focus:border-[#4F8EFF]/60 focus:bg-white/[0.12] focus:ring-2 focus:ring-[#4F8EFF]/15"
            />
            <button
              onClick={() => void handleSignIn()}
              className="mt-1 w-full rounded-xl bg-[#0F46D8] py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/40 transition-all hover:bg-[#0A3DC0] hover:shadow-blue-700/50"
            >
              로그인하기
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-white/35">
            아직 계정이 없으신가요?{" "}
            <Link href="/register" className="font-semibold text-[#4F8EFF] transition-colors hover:text-[#7BB0FF]">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
