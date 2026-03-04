"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client"; // 경로 확인 필요
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/status",
      },
      {
        onSuccess: () => {
          window.location.href = "/status";
        },
        onError: (ctx) => {
          console.error("Login error:", ctx.error);
          alert(ctx.error.message || "로그인에 실패했습니다.");
        },
      },
    );
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
          border: "1px solid #EAEAEA",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h1
          style={{
            color: "#0046FE",
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          로그인
        </h1>
        <p
          style={{
            color: "#2E67FE",
            fontSize: "14px",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          코딩테스트 로드맵 플랫폼에 오신 것을 환영합니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="email"
            placeholder="이메일"
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #DDD",
              borderRadius: "8px",
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="비밀번호"
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #DDD",
              borderRadius: "8px",
              outline: "none",
            }}
          />
          <button
            onClick={handleSignIn}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#0046FE",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              marginTop: "8px",
            }}
          >
            로그인하기
          </button>
        </div>

        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#666",
            textAlign: "center",
          }}
        >
          아직 계정이 없으신가요?{" "}
          <Link
            href="/register"
            style={{ color: "#2E67FE", textDecoration: "none", fontWeight: "600" }}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
