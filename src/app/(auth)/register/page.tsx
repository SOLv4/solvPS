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
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (errorKey: keyof FormErrors) =>
    `w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 ${
      errors[errorKey]
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-gray-200 focus:border-[#0F46D8]/50 focus:ring-[#0F46D8]/10"
    }`;

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
          <h2 className="mb-6 text-lg font-bold text-gray-900">회원가입</h2>
          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">이름</label>
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">이메일</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass("email")}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••  (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass("password")}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">백준 아이디</label>
              <input
                type="text"
                placeholder="solved.ac 아이디"
                value={bojHandle}
                onChange={(e) => setBojHandle(e.target.value)}
                className={inputClass("bojHandle")}
              />
              {errors.bojHandle && <p className="mt-1 text-xs text-red-500">{errors.bojHandle}</p>}
            </div>
            <button
              onClick={() => void handleSignUp()}
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#0F46D8] py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-[#0A3DC0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "가입 중..." : "가입하기"}
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-semibold text-[#0F46D8] hover:text-[#0A3DC0]">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
