import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import { roadmaps, roadmapSteps, teamMembers, userRoadmapProgresses } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

// GET /api/group/[id]/progress
// 현재 유저의 이 팀 로드맵 스텝 완료 현황 { [stepId]: boolean }
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(session.user.id);

  // 이 팀의 모든 스텝 id 조회
  const steps = await db
    .select({ id: roadmapSteps.id })
    .from(roadmapSteps)
    .innerJoin(roadmaps, eq(roadmapSteps.roadmap_id, roadmaps.id))
    .where(eq(roadmaps.team_id, teamId));

  if (steps.length === 0) return NextResponse.json({});

  const stepIds = steps.map((s) => s.id);

  const progresses = await db
    .select({ step_id: userRoadmapProgresses.step_id, completed: userRoadmapProgresses.completed })
    .from(userRoadmapProgresses)
    .where(
      and(
        eq(userRoadmapProgresses.user_id, userId),
        inArray(userRoadmapProgresses.step_id, stepIds)
      )
    );

  const result: Record<number, boolean> = {};
  for (const p of progresses) {
    result[p.step_id] = p.completed;
  }

  return NextResponse.json(result);
}

// POST /api/group/[id]/progress
// Body: { stepId: number, completed: boolean }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(session.user.id);

  // 팀 멤버 확인
  const isMember = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)))
    .then((r) => r.length > 0);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { stepId, completed } = (await req.json()) as { stepId: number; completed: boolean };
  if (!stepId || completed == null) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const existing = await db
    .select({ id: userRoadmapProgresses.id })
    .from(userRoadmapProgresses)
    .where(and(eq(userRoadmapProgresses.user_id, userId), eq(userRoadmapProgresses.step_id, stepId)));

  if (existing.length > 0) {
    await db
      .update(userRoadmapProgresses)
      .set({ completed, completed_at: completed ? new Date() : null })
      .where(and(eq(userRoadmapProgresses.user_id, userId), eq(userRoadmapProgresses.step_id, stepId)));
  } else {
    await db.insert(userRoadmapProgresses).values({
      user_id: userId,
      step_id: stepId,
      completed,
      completed_at: completed ? new Date() : null,
    });
  }

  return NextResponse.json({ ok: true });
}
