import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // better-auth API URL - 환경변수로 설정하거나 기본값
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});