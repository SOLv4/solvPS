import { NextRequest, NextResponse } from "next/server";

const SOLVED_AC_BASE = "https://solved.ac/api/v3";
const DEFAULT_USER_AGENT = "solvPS/1.0 (problem-search)";

type SolvedAcProblem = {
  problemId: number;
  titleKo?: string;
  level: number;
  tags?: Array<{
    key: string;
    displayNames?: Array<{ language: string; name: string }>;
  }>;
};

function tierExprFromPreset(preset: string) {
  if (preset === "1-5") return "tier:1..5";
  if (preset === "6-10") return "tier:6..10";
  if (preset === "11-15") return "tier:11..15";
  return "tier:1..30";
}

function buildSolvedAcQuery(q: string, tier: string, tag: string) {
  const parts: string[] = [tierExprFromPreset(tier)];
  const trimmedQ = q.trim();
  const trimmedTag = tag.trim();

  if (trimmedQ) {
    if (/^\d+$/.test(trimmedQ)) {
      parts.push(`id:${trimmedQ}`);
    } else {
      parts.push(trimmedQ);
    }
  }

  if (trimmedTag) {
    const tags = trimmedTag
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    for (const value of tags) {
      parts.push(`tag:${value}`);
    }
  }

  return parts.join(" ");
}

function toReadableTags(problem: SolvedAcProblem) {
  return (problem.tags ?? []).slice(0, 4).map((tag) => {
    const ko = tag.displayNames?.find((name) => name.language === "ko")?.name;
    return ko ?? tag.key;
  });
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const tier = request.nextUrl.searchParams.get("tier") ?? "all";
    const tag = request.nextUrl.searchParams.get("tag") ?? "";
    const page = request.nextUrl.searchParams.get("page") ?? "1";
    const size = request.nextUrl.searchParams.get("size") ?? "20";

    const query = buildSolvedAcQuery(q, tier, tag);
    const params = new URLSearchParams({
      query,
      page,
      sort: "level",
      direction: "asc",
    });

    const res = await fetch(`${SOLVED_AC_BASE}/search/problem?${params}`, {
      headers: {
        "User-Agent": process.env.SOLVED_AC_USER_AGENT || DEFAULT_USER_AGENT,
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `solved.ac request failed: ${res.status}`, detail: text },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      count?: number;
      items?: SolvedAcProblem[];
    };

    const items = (data.items ?? []).map((problem) => ({
      id: `boj-${problem.problemId}`,
      bojId: problem.problemId,
      title: problem.titleKo || `문제 ${problem.problemId}`,
      level: problem.level,
      tags: toReadableTags(problem),
      inRoadmap: false,
    }));

    return NextResponse.json({
      count: data.count ?? items.length,
      items: items.slice(0, Number(size)),
    });
  } catch (error) {
    console.error("problems/search error:", error);
    return NextResponse.json(
      { error: "문제 검색 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
