import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userBoj } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, name, boj_handle } = await req.json();

    // 1. 백준 핸들 중복 여부 미리 확인
    const existingBoj = await db.query.userBoj.findFirst({
      where: (userBoj, { eq }) => eq(userBoj.bojHandle, boj_handle),
    });

    if (existingBoj) {
      return NextResponse.json(
        { error: "이미 등록된 백준 핸들입니다." },
        { status: 400 },
      );
    }

    // 2. Better Auth 유저 생성
    const user = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 },
      );
    }

    // 2. 별도의 user_boj 테이블에 백준 정보 저장
    await db.insert(userBoj).values({
      userId: user.user.id as unknown as number, // serial ID이므로 타입 변환 필요할 수 있음
      bojHandle: boj_handle,
    });

    return NextResponse.json({ success: true, user: user.user });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 },
    );
  }
}
