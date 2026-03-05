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
  if (preset === "16-20") return "tier:16..20";
  if (preset === "21-25") return "tier:21..25";
  if (preset === "26-30") return "tier:26..30";
  return "tier:1..30";
}

function buildSolvedAcQuery(q: string, tier: string, tag: string) {
  const parts: string[] = [tierExprFromPreset(tier)];
  const trimmedQ = q.trim();
  const trimmedTag = tag.trim();

  if (trimmedQ) {
    parts.push(trimmedQ);
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

    const trimmedQ = q.trim();
    const numericPrefixQuery = /^\d+$/.test(trimmedQ);
    const sizeNum = Number(size) || 20;
    const headers = {
      "User-Agent": process.env.SOLVED_AC_USER_AGENT || DEFAULT_USER_AGENT,
    };

    let items: Array<{
      id: string;
      bojId: number;
      title: string;
      level: number;
      tags: string[];
      inRoadmap: boolean;
    }> = [];
    let totalCount = 0;

    if (numericPrefixQuery) {
      // 숫자 접두 검색은 id 오름차순에서 여러 페이지를 보며 prefix 일치 항목을 모읍니다.
      // 이렇게 하면 "1" 입력 시 보통 1000대부터 순서대로 보여줄 수 있습니다.
      const baseQuery = buildSolvedAcQuery("", tier, tag);
      const startPage = Math.max(1, Number(page) || 1);
      const maxPagesToScan = 8;

      for (
        let currentPage = startPage;
        currentPage < startPage + maxPagesToScan;
        currentPage += 1
      ) {
        const params = new URLSearchParams({
          query: baseQuery,
          page: String(currentPage),
          sort: "id",
          direction: "asc",
        });

        const res = await fetch(`${SOLVED_AC_BASE}/search/problem?${params}`, {
          headers,
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

        totalCount = data.count ?? totalCount;
        const matched = (data.items ?? []).filter((problem) =>
          String(problem.problemId).startsWith(trimmedQ),
        );

        items.push(
          ...matched.map((problem) => ({
            id: `boj-${problem.problemId}`,
            bojId: problem.problemId,
            title: problem.titleKo || `문제 ${problem.problemId}`,
            level: problem.level,
            tags: toReadableTags(problem),
            inRoadmap: false,
          })),
        );

        if (items.length >= sizeNum || (data.items ?? []).length === 0) {
          break;
        }
      }
    } else {
      const query = buildSolvedAcQuery(q, tier, tag);
      const params = new URLSearchParams({
        query,
        page,
        sort: "level",
        direction: "asc",
      });

      const res = await fetch(`${SOLVED_AC_BASE}/search/problem?${params}`, {
        headers,
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

      totalCount = data.count ?? 0;
      items = (data.items ?? []).map((problem) => ({
        id: `boj-${problem.problemId}`,
        bojId: problem.problemId,
        title: problem.titleKo || `문제 ${problem.problemId}`,
        level: problem.level,
        tags: toReadableTags(problem),
        inRoadmap: false,
      }));
    }

    return NextResponse.json({
      count: totalCount || items.length,
      items: items.slice(0, sizeNum),
    });
  } catch (error) {
    console.error("problems/search error:", error);
    return NextResponse.json(
      { error: "문제 검색 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
