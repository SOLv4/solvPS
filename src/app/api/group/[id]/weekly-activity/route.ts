import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  integrationSubmissions,
  problems,
  teamMembers,
  userBoj,
  users,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

type MemberBase = {
  userId: number;
  name: string;
  handle: string;
  role: string;
  joinedAt: string;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calcCurrentStreak(activeDaySet: Set<string>, today: Date) {
  let streak = 0;
  const cursor = startOfDay(today);
  while (activeDaySet.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const teamId = Number(id);
    if (!Number.isFinite(teamId) || teamId <= 0) {
      return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const members = await db
      .select({
        userId: teamMembers.user_id,
        name: users.name,
        role: teamMembers.role,
        joinedAt: teamMembers.joined_at,
        handle: userBoj.bojHandle,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.user_id, users.id))
      .leftJoin(userBoj, eq(userBoj.userId, users.id))
      .where(eq(teamMembers.team_id, teamId));

    const memberBases: MemberBase[] = members.map((m) => ({
      userId: m.userId,
      name: m.name || `user-${m.userId}`,
      handle: m.handle || `user-${m.userId}`,
      role: m.role,
      joinedAt: new Date(m.joinedAt).toISOString(),
    }));

    if (memberBases.length === 0) {
      return NextResponse.json({ rangeDays: 7, labels: [], members: [] });
    }

    const memberIds = memberBases.map((m) => m.userId);
    const joinedAtByUser = new Map<number, Date>(
      memberBases.map((m) => [m.userId, new Date(m.joinedAt)])
    );
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfDay(new Date(today));
    const day = weekStart.getDay(); // Sun=0, Mon=1 ... Sat=6
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diffToMonday);
    const weekEnd = startOfDay(new Date(weekStart));
    weekEnd.setDate(weekStart.getDate() + 6);
    const longWindowStart = startOfDay(new Date(today));
    longWindowStart.setDate(longWindowStart.getDate() - 55);

    const labels = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return dayKey(d);
    });

    const submissions = await db
      .select({
        userId: integrationSubmissions.user_id,
        capturedAt: integrationSubmissions.captured_at,
        submissionId: integrationSubmissions.submission_id,
        problemId: integrationSubmissions.problem_id,
        level: problems.level,
      })
      .from(integrationSubmissions)
      .leftJoin(problems, eq(problems.boj_id, integrationSubmissions.problem_id))
      .where(
        and(
          eq(integrationSubmissions.result, "accepted"),
          inArray(integrationSubmissions.user_id, memberIds),
          gte(integrationSubmissions.captured_at, longWindowStart)
        )
      )
      .orderBy(desc(integrationSubmissions.captured_at));

    const byMember = new Map<
      number,
      {
        weeklyDailyCount: number[];
        activeDaySet: Set<string>;
        weeklyDifficultyScore: number;
        seenSubmissionIds: Set<string>;
      }
    >();

    for (const m of memberBases) {
      byMember.set(m.userId, {
        weeklyDailyCount: Array(7).fill(0),
        activeDaySet: new Set<string>(),
        weeklyDifficultyScore: 0,
        seenSubmissionIds: new Set<string>(),
      });
    }

    for (const row of submissions) {
      const bucket = byMember.get(row.userId);
      if (!bucket) continue;
      if (bucket.seenSubmissionIds.has(row.submissionId)) continue;
      bucket.seenSubmissionIds.add(row.submissionId);

      const capturedDate = new Date(row.capturedAt);
      const memberJoinedAt = joinedAtByUser.get(row.userId) ?? new Date(0);
      if (capturedDate.getTime() < memberJoinedAt.getTime()) continue;

      const day = startOfDay(capturedDate);
      const dayStr = dayKey(day);
      bucket.activeDaySet.add(dayStr);

      if (day >= weekStart && day <= weekEnd) {
        const dayIndex = Math.floor((day.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          bucket.weeklyDailyCount[dayIndex] += 1;
          const level = Number(row.level ?? 0);
          bucket.weeklyDifficultyScore += Math.log2(level + 1) * 12;
        }
      }
    }

    const result = memberBases
      .map((m) => {
        const bucket = byMember.get(m.userId)!;
        const currentStreak = calcCurrentStreak(bucket.activeDaySet, today);
        const activeDays = bucket.weeklyDailyCount.filter((v) => v > 0).length;
        const weeklySolved = bucket.weeklyDailyCount.reduce((a, b) => a + b, 0);
        const streakScore = Math.pow(currentStreak, 1.35) * 6;
        const consistencyBonus = activeDays * 2;
        const weeklyScore = bucket.weeklyDifficultyScore + streakScore + consistencyBonus;

        return {
          userId: m.userId,
          name: m.name,
          handle: m.handle,
          role: m.role,
          joinedAt: m.joinedAt,
          dailySolved: bucket.weeklyDailyCount,
          weeklySolved,
          activeDays,
          currentStreak,
          difficultyScore: Number(bucket.weeklyDifficultyScore.toFixed(1)),
          streakScore: Number(streakScore.toFixed(1)),
          consistencyBonus: Number(consistencyBonus.toFixed(1)),
          weeklyScore: Number(weeklyScore.toFixed(1)),
        };
      })
      .sort((a, b) => b.weeklyScore - a.weeklyScore);

    return NextResponse.json({
      rangeDays: 7,
      labels,
      members: result,
      scoring: {
        difficulty: "sum(log2(level + 1) * 12)",
        streak: "currentStreak^1.35 * 6",
        consistency: "activeDays * 2",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
