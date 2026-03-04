import { headers } from "next/headers";
import { auth } from "@/lib/auth/index";
import { db } from "@/lib/db";
import { userBoj } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * 현재 로그인된 유저 + BOJ 정보를 반환합니다.
 * Better Auth 세션 기반
 */
export async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const boj = await db.query.userBoj.findFirst({
    where: eq(userBoj.userId, session.user.id as unknown as number),
  });

  return { ...session.user, boj };
}
