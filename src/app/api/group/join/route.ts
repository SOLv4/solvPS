import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, teams, teamMembers } from "@/lib/db/schema";
import { auth } from "@/lib/auth/index";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invite_code } = await req.json();
  if (!invite_code) {
    return NextResponse.json({ error: "invite_code is required" }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, Number(session.user.id)));

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [team] = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.invite_code, invite_code.toUpperCase()));

  if (!team) {
    return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
  }

  const [existing] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.team_id, team.id), eq(teamMembers.user_id, user.id)));

  if (existing) {
    return NextResponse.json({ id: team.id, already: true });
  }

  await db.insert(teamMembers).values({ team_id: team.id, user_id: user.id, role: "MEMBER" });

  return NextResponse.json({ id: team.id });
}
