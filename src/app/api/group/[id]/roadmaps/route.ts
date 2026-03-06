import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import { roadmaps, teamMembers, teamRoadmaps } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

async function getTeamId(params: Params["params"]) {
  const { id } = await params;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

async function getSessionUserId(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const parsed = Number(session.user.id);
  if (!Number.isNaN(parsed)) return parsed;
  return null;
}

async function isTeamMember(teamId: number, userId: number) {
  const isMember = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)))
    .then((rows) => rows.length > 0);
  return isMember;
}

// POST /api/group/[id]/roadmaps
// Body:
// - { roadmapId } -> 기존 로드맵을 그룹에 추가
// - { title, description? } -> 새 로드맵 생성 후 그룹에 추가
export async function POST(req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }

  const body = (await req.json()) as {
    roadmapId?: number;
    title?: string;
    description?: string;
  };

  const sessionUserId = await getSessionUserId(req);
  if (sessionUserId == null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const creatorId = sessionUserId;
  const member = await isTeamMember(teamId, creatorId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.roadmapId) {
    const [target] = await db
      .select({ id: roadmaps.id })
      .from(roadmaps)
      .where(eq(roadmaps.id, body.roadmapId))
      .limit(1);
    if (!target) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    await db
      .insert(teamRoadmaps)
      .values({
        team_id: teamId,
        roadmap_id: body.roadmapId,
        added_by: creatorId,
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, roadmapId: body.roadmapId });
  }

  const trimmedTitle = (body.title ?? "").trim();
  const trimmedDescription = (body.description ?? "").trim();

  if (!trimmedTitle) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
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

  await db.insert(teamRoadmaps).values({
    team_id: teamId,
    roadmap_id: created.id,
    added_by: creatorId,
  });

  return NextResponse.json({ roadmap: created });
}

// DELETE /api/group/[id]/roadmaps
// Body: { roadmapId }
export async function DELETE(req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }

  const sessionUserId = await getSessionUserId(req);
  if (sessionUserId == null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const member = await isTeamMember(teamId, sessionUserId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { roadmapId } = (await req.json()) as { roadmapId?: number };
  if (!roadmapId) {
    return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });
  }

  const [deletedLink] = await db
    .delete(teamRoadmaps)
    .where(and(eq(teamRoadmaps.roadmap_id, roadmapId), eq(teamRoadmaps.team_id, teamId)))
    .returning({ roadmapId: teamRoadmaps.roadmap_id });

  if (!deletedLink) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
