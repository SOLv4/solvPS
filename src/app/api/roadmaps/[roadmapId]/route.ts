import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import { problems, roadmapProblems, roadmaps, roadmapSteps, users } from "@/lib/db/schema";

// GET /api/roadmaps/[roadmapId]
// 로드맵 상세 + 스텝 + 문제 조회 (팀 인증 불필요)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
  const sessionUserId = session ? Number(session.user.id) : null;

  const { roadmapId: roadmapIdStr } = await params;
  const roadmapId = Number(roadmapIdStr);
  if (isNaN(roadmapId)) return NextResponse.json({ error: "Invalid roadmap id" }, { status: 400 });

  const [roadmap] = await db
    .select({
      id: roadmaps.id,
      title: roadmaps.title,
      description: roadmaps.description,
      createdBy: roadmaps.created_by,
      creatorName: users.name,
    })
    .from(roadmaps)
    .innerJoin(users, eq(users.id, roadmaps.created_by))
    .where(eq(roadmaps.id, roadmapId));

  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  const rows = await db
    .select({
      stepId: roadmapSteps.id,
      stepOrder: roadmapSteps.order,
      stepTitle: roadmapSteps.title,
      stepDescription: roadmapSteps.description,
      bojId: problems.boj_id,
      title: problems.title,
      level: problems.level,
      problemOrder: roadmapProblems.order,
    })
    .from(roadmapSteps)
    .leftJoin(roadmapProblems, eq(roadmapProblems.step_id, roadmapSteps.id))
    .leftJoin(problems, eq(roadmapProblems.problem_id, problems.id))
    .where(eq(roadmapSteps.roadmap_id, roadmapId))
    .orderBy(roadmapSteps.order, roadmapProblems.order);

  type StepEntry = {
    id: number;
    order: number;
    title: string;
    description: string | null;
    problems: { bojId: number; title: string; level: number }[];
  };
  const stepsMap = new Map<number, StepEntry>();
  for (const row of rows) {
    if (!stepsMap.has(row.stepId)) {
      stepsMap.set(row.stepId, {
        id: row.stepId,
        order: row.stepOrder,
        title: row.stepTitle,
        description: row.stepDescription,
        problems: [],
      });
    }
    if (row.bojId !== null) {
      stepsMap.get(row.stepId)!.problems.push({
        bojId: row.bojId,
        title: row.title!,
        level: row.level!,
      });
    }
  }

  return NextResponse.json({
    roadmap: {
      ...roadmap,
      isOwner: sessionUserId != null && roadmap.createdBy === sessionUserId,
    },
    steps: [...stepsMap.values()],
  });
}
