// 추후 API 작업 후 바꿀 것

export type Roadmap = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  problemsCount: number;
};

export type Problem = {
  id: string;
  bojId: number;
  title: string;
  level: number;
  tags: string[];
  inRoadmap?: boolean;
};

export type TierPreset = "all" | "1-5" | "6-10" | "11-15";

export const tierPresetOptions: Array<{ value: TierPreset; label: string }> = [
  { value: "all", label: "전체" },
  { value: "1-5", label: "1-5" },
  { value: "6-10", label: "6-10" },
  { value: "11-15", label: "11-15" },
];

export const mockRoadmaps: Roadmap[] = [
  {
    id: "rm-frontend-core",
    title: "코딩테스트 입문",
    description: "기본 구현/자료구조 위주",
    createdAt: "2026-02-12T09:00:00.000Z",
    problemsCount: 5,
  },
  {
    id: "rm-two-pointer",
    title: "투포인터 집중",
    description: "슬라이딩 윈도우, 투포인터 패턴 정리",
    createdAt: "2026-02-25T11:30:00.000Z",
    problemsCount: 3,
  },
];

export const mockProblems: Problem[] = [
  {
    id: "p-1001",
    bojId: 1001,
    title: "A-B",
    level: 1,
    tags: ["수학", "사칙연산"],
  },
  {
    id: "p-2557",
    bojId: 2557,
    title: "Hello World",
    level: 1,
    tags: ["입출력"],
    inRoadmap: true,
  },
  {
    id: "p-1260",
    bojId: 1260,
    title: "DFS와 BFS",
    level: 7,
    tags: ["그래프", "DFS", "BFS"],
  },
  {
    id: "p-1806",
    bojId: 1806,
    title: "부분합",
    level: 10,
    tags: ["투포인터", "누적합"],
  },
  {
    id: "p-14500",
    bojId: 14500,
    title: "테트로미노",
    level: 11,
    tags: ["브루트포스", "구현"],
  },
  {
    id: "p-9251",
    bojId: 9251,
    title: "LCS",
    level: 13,
    tags: ["DP", "문자열"],
  },
];

export function getMockRoadmaps(): Roadmap[] {
  return mockRoadmaps.map((roadmap) => ({ ...roadmap }));
}

export function getMockProblems(): Problem[] {
  return mockProblems.map((problem) => ({
    ...problem,
    tags: [...problem.tags],
  }));
}

export function createMockRoadmap(input: {
  title: string;
  description?: string;
  orderSeed: number;
}): Roadmap {
  const title = input.title.trim();
  return {
    id: `rm-${Date.now()}-${input.orderSeed}`,
    title,
    description: input.description?.trim(),
    createdAt: new Date().toISOString(),
    problemsCount: 0,
  };
}

export function matchesTierPreset(level: number, preset: TierPreset): boolean {
  if (preset === "all") {
    return true;
  }
  if (preset === "1-5") {
    return level >= 1 && level <= 5;
  }
  if (preset === "6-10") {
    return level >= 6 && level <= 10;
  }
  return level >= 11 && level <= 15;
}

export function filterProblems(
  problems: Problem[],
  filter: { q: string; tierPreset: TierPreset; tagQuery: string },
): Problem[] {
  const q = filter.q.trim().toLowerCase();
  const tagQuery = filter.tagQuery.trim().toLowerCase();

  return problems.filter((problem) => {
    const matchesQ =
      q.length === 0 ||
      problem.title.toLowerCase().includes(q) ||
      String(problem.bojId).includes(q);
    const matchesTier = matchesTierPreset(problem.level, filter.tierPreset);
    const matchesTag =
      tagQuery.length === 0 ||
      problem.tags.some((tag) => tag.toLowerCase().includes(tagQuery));

    return matchesQ && matchesTier && matchesTag;
  });
}
