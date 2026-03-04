import { auth } from "@/lib/auth"; // 위에서 만든 auth 객체
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth가 모든 인증 관련 요청(로그인, 로그아웃 등)을 처리하도록 넘깁니다.
export const { GET, POST } = toNextJsHandler(auth);
