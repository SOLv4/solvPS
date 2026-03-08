import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  teamMembers,
  userBoj,
  users,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getLevelStats, getUserInfo } from "@/lib/status/solvedac";

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

const BOJ_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept-Language": "ko,en;q=0.9",
};

async function fetchAcceptedDailyCountMap(handle: string, minDate: Date) {
  const dayCountMap = new Map<string, number>();
  let nextUrl = `https://www.acmicpc.net/status?from_mine=1&problem_id=&user_id=${encodeURIComponent(handle)}&result_id=4`;
  let page = 0;

  // Safety guard: cap pagination per member
  while (nextUrl && page < 8) {
    page += 1;
    const res = await fetch(nextUrl, { headers: BOJ_HEADERS, cache: "no-store" });
    if (!res.ok) break;
    const html = await res.text();

    const tsRegex = /data-timestamp="(\d+)"/g;
    let hasNewerThanMin = false;
    let match: RegExpExecArray | null;
    while ((match = tsRegex.exec(html)) !== null) {
      const ts = Number(match[1]);
      if (!Number.isFinite(ts)) continue;
      const d = new Date(ts * 1000);
      if (d >= minDate) {
        hasNewerThanMin = true;
        const key = dayKey(startOfDay(d));
        dayCountMap.set(key, (dayCountMap.get(key) ?? 0) + 1);
      }
    }

    const nextMatch = html.match(/id="next_page"[^>]*href="([^"]+)"/);
    if (!nextMatch) break;
    if (!hasNewerThanMin) break;
    nextUrl = `https://www.acmicpc.net${nextMatch[1]}`;
  }

  return dayCountMap;
}

function calcCurrentStreak(dayCountMap: Map<string, number>, today: Date) {
  let streak = 0;
  const cursor = startOfDay(today);
  while ((dayCountMap.get(dayKey(cursor)) ?? 0) > 0) {
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

    const today = startOfDay(new Date());
    const weekStart = startOfDay(new Date(today));
    const day = weekStart.getDay(); // Sun=0, Mon=1 ... Sat=6
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diffToMonday);

    const labels = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return dayKey(d);
    });

    const result = await Promise.all(
      memberBases.map(async (m) => {
        const emptyDaily = Array(7).fill(0);

        if (!m.handle || m.handle.startsWith("user-")) {
          return {
            userId: m.userId,
            name: m.name,
            handle: m.handle,
            role: m.role,
            joinedAt: m.joinedAt,
            dailySolved: emptyDaily,
            weeklySolved: 0,
            activeDays: 0,
            currentStreak: 0,
            difficultyScore: 0,
            streakScore: 0,
            consistencyBonus: 0,
            weeklyScore: 0,
          };
        }

        try {
          const [userInfo, levelStats, acceptedDailyCountMap] = await Promise.all([
            getUserInfo(m.handle),
            getLevelStats(m.handle),
            fetchAcceptedDailyCountMap(m.handle, weekStart),
          ]);

          const weightedDifficulty = levelStats.reduce((acc, s) => {
            const level = Number(s.level ?? 0);
            const solved = Number(s.solved ?? 0);
            if (level <= 0 || solved <= 0) return acc;
            return acc + Math.pow(level, 1.12) * solved;
          }, 0);

          const difficultyScore = weightedDifficulty / 18;
          const dailySolved: number[] = labels.map((k) => acceptedDailyCountMap.get(k) ?? 0);
          const currentStreak = calcCurrentStreak(acceptedDailyCountMap, today);
          const maxStreak = Number(userInfo.maxStreak ?? 0);
          const totalSolved = Number(userInfo.solvedCount ?? 0);
          const streakScore = Math.pow(maxStreak, 1.25) * 4;
          const volumeScore = Math.log2(totalSolved + 1) * 26;
          const weeklyScore = difficultyScore + streakScore + volumeScore;
          const activeDays = dailySolved.filter((v) => v > 0).length;
          const weeklySolved = dailySolved.reduce<number>((a, b) => a + b, 0);

          return {
            userId: m.userId,
            name: m.name,
            handle: m.handle,
            role: m.role,
            joinedAt: m.joinedAt,
            dailySolved,
            weeklySolved,
            activeDays,
            currentStreak,
            difficultyScore: Number(difficultyScore.toFixed(1)),
            streakScore: Number(streakScore.toFixed(1)),
            consistencyBonus: Number(volumeScore.toFixed(1)),
            weeklyScore: Number(weeklyScore.toFixed(1)),
          };
        } catch (error) {
          console.error("[weekly-activity] solved.ac fetch failed:", m.handle, error);
          return {
            userId: m.userId,
            name: m.name,
            handle: m.handle,
            role: m.role,
            joinedAt: m.joinedAt,
            dailySolved: emptyDaily,
            weeklySolved: 0,
            activeDays: 0,
            currentStreak: 0,
            difficultyScore: 0,
            streakScore: 0,
            consistencyBonus: 0,
            weeklyScore: 0,
          };
        }
      })
    );

    result.sort((a, b) => b.weeklyScore - a.weeklyScore);

    return NextResponse.json({
      rangeDays: 7,
      labels,
      members: result,
      scoring: {
        difficulty: "sum(level^1.12 * solved) / 18",
        streak: "maxStreak^1.25 * 4",
        consistency: "log2(solvedCount + 1) * 26",
      },
    });
  } catch (error) {
    console.error("[weekly-activity] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
