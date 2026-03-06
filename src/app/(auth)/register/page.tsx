"use client";

import { useState } from "react";
import { z } from "zod";
import Link from "next/link";

const registerSchema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  bojHandle: z.string().min(1, "백준 아이디를 입력해 주세요."),
});

type FormErrors = {
  [key in keyof z.infer<typeof registerSchema>]?: string;
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bojHandle, setBojHandle] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSignUp = async () => {
    setErrors({});

    const validation = registerSchema.safeParse({ name, email, password, bojHandle });

    if (!validation.success) {
      const formattedErrors: FormErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0] as keyof FormErrors;
        if (!formattedErrors[path]) formattedErrors[path] = err.message;
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, boj_handle: bojHandle }),
      });

      const data = await res.json();
      if (data.success) {
        alert("회원가입 성공!");
        window.location.href = "/login";
      } else {
        setErrors({ email: data.error || "회원가입 실패" });
      }
    } catch {
      alert("서버 연결 오류가 발생했습니다.");
    }
  };

  const inputClass = (errorKey: keyof FormErrors) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm text-white outline-none backdrop-blur-sm transition-all placeholder:text-white/30 focus:ring-2 ${
      errors[errorKey]
        ? "border-red-500/50 bg-red-500/[0.08] focus:border-red-400/60 focus:ring-red-500/10"
        : "border-white/[0.12] bg-white/[0.08] focus:border-[#4F8EFF]/60 focus:bg-white/[0.12] focus:ring-[#4F8EFF]/15"
    }`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060d1f] px-4 py-10">
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
          <h2 className="mb-6 text-lg font-semibold text-white">회원가입</h2>

          <div className="flex flex-col gap-3">
            {/* 이름 */}
            <div>
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass("name")}
              />
              {errors.name && <p className="mt-1 pl-0.5 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* 이메일 */}
            <div>
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass("email")}
              />
              {errors.email && <p className="mt-1 pl-0.5 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass("password")}
              />
              {errors.password && <p className="mt-1 pl-0.5 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* 백준 아이디 */}
            <div>
              <input
                type="text"
                placeholder="백준 아이디"
                value={bojHandle}
                onChange={(e) => setBojHandle(e.target.value)}
                className={inputClass("bojHandle")}
              />
              {errors.bojHandle && <p className="mt-1 pl-0.5 text-xs text-red-400">{errors.bojHandle}</p>}
            </div>

            <button
              onClick={() => void handleSignUp()}
              className="mt-1 w-full rounded-xl bg-[#0F46D8] py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/40 transition-all hover:bg-[#0A3DC0] hover:shadow-blue-700/50"
            >
              가입하기
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-white/35">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-semibold text-[#4F8EFF] transition-colors hover:text-[#7BB0FF]">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
