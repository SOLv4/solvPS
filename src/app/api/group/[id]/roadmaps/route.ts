import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import { roadmaps, teamMembers, teamRoadmaps, teams } from "@/lib/db/schema";

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

async function resolveFallbackCreatorId(teamId: number) {
  const [team] = await db
    .select({ createdBy: teams.created_by })
    .from(teams)
    .where(eq(teams.id, teamId));

  if (team?.createdBy) return team.createdBy;

  const [member] = await db
    .select({ userId: teamMembers.user_id })
    .from(teamMembers)
    .where(eq(teamMembers.team_id, teamId));

  return member?.userId ?? null;
}

// POST /api/group/[id]/roadmaps
// Body: { title, description? }
export async function POST(req: NextRequest, ctx: Params) {
  const teamId = await getTeamId(ctx.params);
  if (!teamId) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }

  const sessionUserId = await getSessionUserId(req);
  let creatorId: number | null = null;

  if (sessionUserId != null) {
    const member = await isTeamMember(teamId, sessionUserId);
    if (member) creatorId = sessionUserId;
  }

  if (creatorId == null) {
    creatorId = await resolveFallbackCreatorId(teamId);
  }

  if (creatorId == null) {
    return NextResponse.json(
      { error: "Cannot resolve created_by for this team" },
      { status: 400 },
    );
  }

  const { title, description } = (await req.json()) as {
    title?: string;
    description?: string;
  };

  const trimmedTitle = (title ?? "").trim();
  const trimmedDescription = (description ?? "").trim();

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

  const remains = await db
    .select({ roadmapId: teamRoadmaps.roadmap_id })
    .from(teamRoadmaps)
    .where(eq(teamRoadmaps.roadmap_id, roadmapId))
    .limit(1);

  if (remains.length === 0) {
    await db.delete(roadmaps).where(eq(roadmaps.id, roadmapId));
  }

  return NextResponse.json({ ok: true });
}
