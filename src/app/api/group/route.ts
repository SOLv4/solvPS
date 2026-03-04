import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, teams, teamMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // 세션 user.id로 users 테이블에서 유저 조회
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, Number(session.user.id)));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const invite_code = crypto.randomUUID().slice(0, 8).toUpperCase();

  const [team] = await db
    .insert(teams)
    .values({ name, invite_code, created_by: user.id })
    .returning({
      id: teams.id,
      name: teams.name,
      invite_code: teams.invite_code,
    });

  await db
    .insert(teamMembers)
    .values({ team_id: team.id, user_id: user.id, role: "OWNER" });

  return NextResponse.json(team, { status: 201 });
}
