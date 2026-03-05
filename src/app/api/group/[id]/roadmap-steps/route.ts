import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/index";
import { teamMembers, teamRoadmaps, roadmapSteps } from "@/lib/db/schema";

type Params = { params: Promise<{ id: string }> };

// POST /api/group/[id]/roadmap-steps
// Body: { roadmapId, title, description? }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const teamId = Number(id);
  if (isNaN(teamId)) return NextResponse.json({ error: "Invalid team id" }, { status: 400 });

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isMember = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, Number(session.user.id))))
    .then((r) => r.length > 0);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { roadmapId, title, description } = (await req.json()) as {
    roadmapId: number;
    title: string;
    description?: string;
  };

  if (!roadmapId || !title?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [roadmapLink] = await db
    .select()
    .from(teamRoadmaps)
    .where(and(eq(teamRoadmaps.team_id, teamId), eq(teamRoadmaps.roadmap_id, roadmapId)));
  if (!roadmapLink) return NextResponse.json({ error: "Roadmap not found in team" }, { status: 404 });

  const [maxRow] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${roadmapSteps.order}), 0)` })
    .from(roadmapSteps)
    .where(eq(roadmapSteps.roadmap_id, roadmapId));

  const [step] = await db
    .insert(roadmapSteps)
    .values({
      roadmap_id: roadmapId,
      order: (maxRow?.maxOrder ?? 0) + 1,
      title: title.trim(),
      description: description?.trim() ?? null,
    })
    .returning();

  return NextResponse.json(step, { status: 201 });
}
