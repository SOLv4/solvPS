import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import {
  roadmapProblems,
  roadmaps,
  roadmapSteps,
  teamMembers,
  teamRoadmaps,
  teams,
  users,
} from "@/lib/db/schema";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: roadmaps.id,
        title: roadmaps.title,
        description: roadmaps.description,
        createdAt: roadmaps.created_at,
        teamId: sql<number | null>`min(${teamRoadmaps.team_id})`,
        teamName: sql<string | null>`min(${teams.name})`,
        problemsCount: sql<number>`count(distinct ${roadmapProblems.id})`,
      })
      .from(roadmaps)
      .leftJoin(teamRoadmaps, eq(teamRoadmaps.roadmap_id, roadmaps.id))
      .leftJoin(teams, eq(teams.id, teamRoadmaps.team_id))
      .leftJoin(roadmapSteps, eq(roadmapSteps.roadmap_id, roadmaps.id))
      .leftJoin(roadmapProblems, eq(roadmapProblems.step_id, roadmapSteps.id))
      .groupBy(roadmaps.id, roadmaps.title, roadmaps.description, roadmaps.created_at)
      .orderBy(desc(roadmaps.created_at));

    const items = rows.map((roadmap) => ({
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      createdAt: roadmap.createdAt,
      teamId: roadmap.teamId ?? null,
      teamName: roadmap.teamName ?? null,
      problemsCount: Number(roadmap.problemsCount ?? 0),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/roadmaps error:", error);
    return NextResponse.json(
      { error: "로드맵 목록 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

async function resolveCreatorId() {
  const [fallbackUser] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(users.id)
    .limit(1);

  return fallbackUser?.id ?? null;
}

// POST /api/roadmaps
// Body: { title, description?, teamId? }
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, teamId } = (await req.json()) as {
      title?: string;
      description?: string;
      teamId?: number | null;
    };

    const trimmedTitle = (title ?? "").trim();
    const trimmedDescription = (description ?? "").trim();
    if (!trimmedTitle) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const parsedUserId = Number(session.user.id);
    const creatorId = Number.isNaN(parsedUserId) ? await resolveCreatorId() : parsedUserId;

    if (!creatorId) {
      return NextResponse.json(
        { error: "사용자 데이터가 없어 로드맵을 생성할 수 없습니다." },
        { status: 400 },
      );
    }

    const [creatorExists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, creatorId))
      .limit(1);
    if (!creatorExists) {
      return NextResponse.json(
        { error: `created_by(${creatorId}) 사용자가 users 테이블에 없습니다.` },
        { status: 400 },
      );
    }

    const normalizedTeamId =
      typeof teamId === "number" && Number.isFinite(teamId) ? teamId : null;

    if (normalizedTeamId != null) {
      const [teamExists] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.id, normalizedTeamId))
        .limit(1);
      if (!teamExists) {
        return NextResponse.json({ error: "유효하지 않은 그룹입니다." }, { status: 400 });
      }

      const [membership] = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(
          and(eq(teamMembers.team_id, normalizedTeamId), eq(teamMembers.user_id, creatorId)),
        )
        .limit(1);

      if (!membership) {
        return NextResponse.json({ error: "해당 그룹 멤버만 생성할 수 있습니다." }, { status: 403 });
      }
    }

    const [created] = await db
      .insert(roadmaps)
      .values({
        title: trimmedTitle,
        description: trimmedDescription || null,
        created_by: creatorId,
        is_public: false,
      })
      .returning({
        id: roadmaps.id,
        title: roadmaps.title,
        description: roadmaps.description,
        createdAt: roadmaps.created_at,
      });

    if (normalizedTeamId != null) {
      await db.insert(teamRoadmaps).values({
        team_id: normalizedTeamId,
        roadmap_id: created.id,
        added_by: creatorId,
      });
    }

    return NextResponse.json({ roadmap: created });
  } catch (error) {
    console.error("POST /api/roadmaps error:", error);
    const pg = error as {
      message?: string;
      code?: string;
      detail?: string;
      constraint?: string;
      table?: string;
      schema?: string;
      column?: string;
    };
    return NextResponse.json(
      {
        error: "로드맵 생성 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
        pgCode: pg.code ?? null,
        pgDetail: pg.detail ?? null,
        pgConstraint: pg.constraint ?? null,
        pgTable: pg.table ?? null,
        pgColumn: pg.column ?? null,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/roadmaps
// Body: { roadmapId }
export async function DELETE(req: NextRequest) {
  try {
    const { roadmapId } = (await req.json()) as { roadmapId?: number };
    if (!roadmapId) {
      return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(roadmaps)
      .where(eq(roadmaps.id, roadmapId))
      .returning({ id: roadmaps.id });

    if (!deleted) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/roadmaps error:", error);
    return NextResponse.json(
      { error: "로드맵 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
