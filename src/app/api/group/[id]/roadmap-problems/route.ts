import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import {
  roadmaps,
  roadmapSteps,
  roadmapProblems,
  problems,
  teamMembers,
  teamRoadmaps,
} from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

async function getTeamId(params: Params["params"]) {
  const { id } = await params;
  const n = Number(id);
  return isNaN(n) ? null : n;
}

// GET /api/group/[id]/roadmap-problems
// - roadmapId 지정: 해당 로드맵의 문제 목록 { items: [...] }
// - roadmapId 미지정: 이 팀의 모든 로드맵 문제 매핑 { [bojId]: roadmapId[] }
export async function GET(_req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const roadmapIdParam = _req.nextUrl.searchParams.get("roadmapId");
  const roadmapId = roadmapIdParam ? Number(roadmapIdParam) : null;

  if (roadmapId) {
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
      .innerJoin(roadmaps, eq(roadmaps.id, roadmapSteps.roadmap_id))
      .innerJoin(teamRoadmaps, eq(teamRoadmaps.roadmap_id, roadmaps.id))
      .where(and(eq(teamRoadmaps.team_id, teamId), eq(roadmaps.id, roadmapId)))
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

    return NextResponse.json({ steps: [...stepsMap.values()] });
  }

  const rows = await db
    .select({ bojId: problems.boj_id, roadmapId: roadmaps.id })
    .from(roadmapProblems)
    .innerJoin(roadmapSteps, eq(roadmapProblems.step_id, roadmapSteps.id))
    .innerJoin(roadmaps, eq(roadmapSteps.roadmap_id, roadmaps.id))
    .innerJoin(teamRoadmaps, eq(teamRoadmaps.roadmap_id, roadmaps.id))
    .innerJoin(problems, eq(roadmapProblems.problem_id, problems.id))
    .where(eq(teamRoadmaps.team_id, teamId));

  const map: Record<number, number[]> = {};
  for (const row of rows) {
    if (!map[row.bojId]) map[row.bojId] = [];
    if (!map[row.bojId].includes(row.roadmapId)) {
      map[row.bojId].push(row.roadmapId);
    }
  }
  return NextResponse.json(map);
}

// POST /api/group/[id]/roadmap-problems
// Body: { bojId, title, level, roadmapId }
export async function POST(req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isMember = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.team_id, teamId),
        eq(teamMembers.user_id, Number(session.user.id))
      )
    )
    .then((r) => r.length > 0);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bojId, title, level, roadmapId } = (await req.json()) as {
    bojId: number;
    title: string;
    level: number;
    roadmapId: number;
  };

  if (!bojId || !title || level == null || !roadmapId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [roadmapLink] = await db
    .select({ roadmapId: teamRoadmaps.roadmap_id })
    .from(teamRoadmaps)
    .where(and(eq(teamRoadmaps.team_id, teamId), eq(teamRoadmaps.roadmap_id, roadmapId)))
    .limit(1);

  if (!roadmapLink) {
    const [roadmapExists] = await db
      .select({ id: roadmaps.id })
      .from(roadmaps)
      .where(eq(roadmaps.id, roadmapId))
      .limit(1);

    if (!roadmapExists) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    await db.insert(teamRoadmaps).values({
      team_id: teamId,
      roadmap_id: roadmapId,
      added_by: Number(session.user.id),
    });
  }

  // 1. 문제 upsert
  const [problem] = await db
    .insert(problems)
    .values({ boj_id: bojId, title, level })
    .onConflictDoUpdate({ target: problems.boj_id, set: { title, level } })
    .returning({ id: problems.id });

  // 2. 로드맵의 첫 번째 스텝 조회 (없으면 생성)
  let [step] = await db
    .select({ id: roadmapSteps.id })
    .from(roadmapSteps)
    .where(eq(roadmapSteps.roadmap_id, roadmapId))
    .orderBy(roadmapSteps.order)
    .limit(1);

  if (!step) {
    [step] = await db
      .insert(roadmapSteps)
      .values({ roadmap_id: roadmapId, order: 1, title: "기본 문제" })
      .returning({ id: roadmapSteps.id });
  }

  // 3. 이미 이 로드맵 어딘가에 담겨있는지 확인
  const existing = await db
    .select({ id: roadmapProblems.id })
    .from(roadmapProblems)
    .innerJoin(roadmapSteps, eq(roadmapSteps.id, roadmapProblems.step_id))
    .where(
      and(
        eq(roadmapSteps.roadmap_id, roadmapId),
        eq(roadmapProblems.problem_id, problem.id)
      )
    );

  if (existing.length === 0) {
    const [maxRow] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${roadmapProblems.order}), 0)` })
      .from(roadmapProblems)
      .where(eq(roadmapProblems.step_id, step.id));

    await db.insert(roadmapProblems).values({
      step_id: step.id,
      problem_id: problem.id,
      order: (maxRow?.maxOrder ?? 0) + 1,
    });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/group/[id]/roadmap-problems
// Body: { bojId, roadmapId }
export async function DELETE(req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bojId, roadmapId } = (await req.json()) as {
    bojId: number;
    roadmapId: number;
  };

  const isMember = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.team_id, teamId),
        eq(teamMembers.user_id, Number(session.user.id))
      )
    )
    .then((r) => r.length > 0);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [roadmapLink] = await db
    .select({ roadmapId: teamRoadmaps.roadmap_id })
    .from(teamRoadmaps)
    .where(and(eq(teamRoadmaps.team_id, teamId), eq(teamRoadmaps.roadmap_id, roadmapId)))
    .limit(1);
  if (!roadmapLink) {
    return NextResponse.json({ error: "Roadmap not found in team" }, { status: 404 });
  }

  const [problem] = await db
    .select({ id: problems.id })
    .from(problems)
    .where(eq(problems.boj_id, bojId));

  if (!problem) return NextResponse.json({ ok: true });

  const steps = await db
    .select({ id: roadmapSteps.id })
    .from(roadmapSteps)
    .where(eq(roadmapSteps.roadmap_id, roadmapId));

  if (steps.length > 0) {
    await db
      .delete(roadmapProblems)
      .where(
        and(
          inArray(
            roadmapProblems.step_id,
            steps.map((s) => s.id)
          ),
          eq(roadmapProblems.problem_id, problem.id)
        )
      );
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/group/[id]/roadmap-problems
// Body: { bojId, fromStepId, toStepId }
export async function PATCH(req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bojId, fromStepId, toStepId } = (await req.json()) as {
    bojId: number;
    fromStepId: number;
    toStepId: number;
  };

  const [problem] = await db
    .select({ id: problems.id })
    .from(problems)
    .where(eq(problems.boj_id, bojId));
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  await db
    .update(roadmapProblems)
    .set({ step_id: toStepId })
    .where(
      and(eq(roadmapProblems.step_id, fromStepId), eq(roadmapProblems.problem_id, problem.id))
    );

  return NextResponse.json({ ok: true });
}
