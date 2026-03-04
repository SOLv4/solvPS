"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bojHandle, setBojHandle] = useState("");

  const handleSignUp = async () => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, boj_handle: bojHandle }),
      });
      const data = await res.json();
      if (data.success) {
        alert("회원가입이 완료되었습니다. 로그인해 주세요!");
        window.location.href = "/login";
      } else {
        alert(data.error || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
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
          회원가입
        </h1>
        <p
          style={{
            color: "#2E67FE",
            fontSize: "14px",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          나만의 코딩테스트 로드맵을 만들어보세요.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            type="text"
            placeholder="이름"
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #DDD",
              borderRadius: "8px",
            }}
          />
          <input
            type="email"
            placeholder="이메일"
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #DDD",
              borderRadius: "8px",
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
            }}
          />
          <input
            type="text"
            placeholder="백준 아이디"
            onChange={(e) => setBojHandle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #DDD",
              borderRadius: "8px",
            }}
          />
          <button
            onClick={handleSignUp}
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
            가입하기
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
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            style={{
              color: "#2E67FE",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
