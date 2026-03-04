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

// 에러 타입을 추출합니다.
type FormErrors = {
  [key in keyof z.infer<typeof registerSchema>]?: string;
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bojHandle, setBojHandle] = useState("");

  // 에러 상태 관리
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSignUp = async () => {
    // 1. 기존 에러 초기화
    setErrors({});

    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      bojHandle,
    });

    if (!validation.success) {
      // 2. Zod 에러를 객체 형태로 변환하여 상태에 저장
      const formattedErrors: FormErrors = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0] as keyof FormErrors;
        if (!formattedErrors[path]) {
          formattedErrors[path] = err.message;
        }
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
        // 서버에서 오는 에러도 에러 상태에 반영 (예: 이미 존재하는 이메일)
        setErrors({ email: data.error || "회원가입 실패" });
      }
    } catch (error) {
      alert("서버 연결 오류가 발생했습니다.");
    }
  };

  // 입력창 스타일을 동적으로 생성하는 함수
  const getInputStyle = (errorKey: keyof FormErrors) => ({
    width: "100%",
    padding: "12px",
    border: `1px solid ${errors[errorKey] ? "#FF4D4F" : "#DDD"}`, // 에러 시 빨간 테두리
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
    // 포커스 시 색상 변경은 인라인 스타일로 한계가 있어 focus 이벤트를 쓰거나 CSS 클래스를 쓰는 게 좋지만,
    // 여기서는 간단하게 border-color만 제어합니다.
  });

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
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* 이름 필드 */}
          <div>
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={getInputStyle("name")}
            />
            {errors.name && <p style={errorTextStyle}>{errors.name}</p>}
          </div>

          {/* 이메일 필드 */}
          <div>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={getInputStyle("email")}
            />
            {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
          </div>

          {/* 비밀번호 필드 */}
          <div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={getInputStyle("password")}
            />
            {errors.password && <p style={errorTextStyle}>{errors.password}</p>}
          </div>

          {/* 백준 아이디 필드 */}
          <div>
            <input
              type="text"
              placeholder="백준 아이디"
              value={bojHandle}
              onChange={(e) => setBojHandle(e.target.value)}
              style={getInputStyle("bojHandle")}
            />
            {errors.bojHandle && (
              <p style={errorTextStyle}>{errors.bojHandle}</p>
            )}
          </div>

          <button onClick={handleSignUp} style={buttonStyle}>
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

const errorTextStyle: React.CSSProperties = {
  color: "#FF4D4F",
  fontSize: "12px",
  marginTop: "4px",
  marginLeft: "4px",
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#0046FE",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  marginTop: "8px",
};
