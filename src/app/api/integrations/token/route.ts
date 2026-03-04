import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamMembers, userBoj } from "@/lib/db/schema";
import { issueIntegrationToken } from "@/lib/integration/token";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const teamId = Number(body?.teamId);
    if (!teamId || Number.isNaN(teamId)) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
    }

    const userId = Number(session.user.id);
    const [membership] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a team member" }, { status: 403 });
    }

    const [boj] = await db
      .select({ bojHandle: userBoj.bojHandle })
      .from(userBoj)
      .where(eq(userBoj.userId, userId))
      .limit(1);

    const token = issueIntegrationToken({ userId, teamId });

    return NextResponse.json({
      token,
      teamId,
      memberHandle: boj?.bojHandle ?? null,
      tokenType: "Bearer",
      expiresInSec: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
