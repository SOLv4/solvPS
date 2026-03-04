import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams, teamMembers, users, userBoj, roadmaps, roadmapSteps } from "@/lib/db/schema";
import { getUserInfo, TIER_NAME } from "@/lib/status/solvedac";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const teamId = Number(id);

  if (isNaN(teamId)) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }

  const [team] = await db
    .select({ id: teams.id, name: teams.name, invite_code: teams.invite_code })
    .from(teams)
    .where(eq(teams.id, teamId));

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // teamMembers → users → userBoj 조인
  const members = await db
    .select({
      bojHandle: userBoj.bojHandle,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.user_id, users.id))
    .innerJoin(userBoj, eq(userBoj.userId, users.id))
    .where(eq(teamMembers.team_id, teamId));

  const memberInfos = await Promise.all(
    members.map(async (m) => {
      try {
        const info = await getUserInfo(m.bojHandle);
        return {
          handle: m.bojHandle,
          role: m.role,
          tier: info.tier,
          tierName: TIER_NAME[info.tier] ?? "Unrated",
          rating: info.rating,
          solvedCount: info.solvedCount,
        };
      } catch {
        return {
          handle: m.bojHandle,
          role: m.role,
          tier: 0,
          tierName: "Unrated",
          rating: 0,
          solvedCount: 0,
        };
      }
    })
  );

  memberInfos.sort((a, b) => b.rating - a.rating);

  // 로드맵 + 스텝 조회
  const roadmapList = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.team_id, teamId));

  const roadmapsWithSteps = await Promise.all(
    roadmapList.map(async (roadmap) => {
      const steps = await db
        .select({
          id: roadmapSteps.id,
          order: roadmapSteps.order,
          title: roadmapSteps.title,
          description: roadmapSteps.description,
        })
        .from(roadmapSteps)
        .where(eq(roadmapSteps.roadmap_id, roadmap.id))
        .orderBy(roadmapSteps.order);

      return { id: roadmap.id, title: roadmap.title, description: roadmap.description, steps };
    })
  );

  return NextResponse.json({ team, members: memberInfos, roadmaps: roadmapsWithSteps });
}
