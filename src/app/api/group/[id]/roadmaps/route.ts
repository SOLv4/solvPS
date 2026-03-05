import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roadmaps, teamMembers, teams } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

async function getTeamId(params: Params["params"]) {
  const { id } = await params;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

async function resolveCreatorId(teamId: number) {
  const [team] = await db
    .select({ createdBy: teams.created_by })
    .from(teams)
    .where(eq(teams.id, teamId));

  if (!team) return null;
  if (team.createdBy) return team.createdBy;

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

  const { title, description } = (await req.json()) as {
    title?: string;
    description?: string;
  };

  const trimmedTitle = (title ?? "").trim();
  const trimmedDescription = (description ?? "").trim();

  if (!trimmedTitle) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const creatorId = await resolveCreatorId(teamId);
  if (!creatorId) {
    return NextResponse.json(
      { error: "Cannot resolve roadmap creator for this team" },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(roadmaps)
    .values({
      title: trimmedTitle,
      description: trimmedDescription || null,
      created_by: creatorId,
      team_id: teamId,
      is_public: false,
    })
    .returning({
      id: roadmaps.id,
      title: roadmaps.title,
      description: roadmaps.description,
      createdAt: roadmaps.created_at,
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

  const [deleted] = await db
    .delete(roadmaps)
    .where(and(eq(roadmaps.id, roadmapId), eq(roadmaps.team_id, teamId)))
    .returning({ id: roadmaps.id });

  if (!deleted) {
    return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

