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

export type TierPreset = "all" | "1-5" | "6-10" | "11-15" | "16-20" | "21-25" | "26-30";

export const tierPresetOptions: Array<{ value: TierPreset; label: string }> = [
  { value: "all", label: "전체" },
  { value: "1-5", label: "브론즈" },
  { value: "6-10", label: "실버" },
  { value: "11-15", label: "골드" },
  { value: "16-20", label: "플래티넘" },
  { value: "21-25", label: "다이아몬드" },
  { value: "26-30", label: "루비" },
];

export type TagPreset = "all" | "implementation" | "greedy" | "dp" | "graphs" | "bruteforcing" | "sorting" | "binary_search" | "trees" | "math" | "string" | "two_pointer" | "data_structures" | "simulation" | "backtracking" | "bitmask" | "bfs" | "dijkstra" | "prefix_sum" | "segtree";

export const tagPresetOptions: Array<{ value: TagPreset; label: string }> = [
  { value: "all", label: "전체" },
  { value: "implementation", label: "구현" },
  { value: "greedy", label: "그리디" },
  { value: "dp", label: "다이나믹 프로그래밍" },
  { value: "graphs", label: "그래프" },
  { value: "bruteforcing", label: "브루트포스" },
  { value: "sorting", label: "정렬" },
  { value: "binary_search", label: "이분 탐색" },
  { value: "trees", label: "트리" },
  { value: "math", label: "수학" },
  { value: "string", label: "문자열" },
  { value: "two_pointer", label: "두 포인터" },
  { value: "data_structures", label: "자료 구조" },
  { value: "simulation", label: "시뮬레이션" },
  { value: "backtracking", label: "백트래킹" },
  { value: "bitmask", label: "비트마스킹" },
  { value: "bfs", label: "너비 우선 탐색 (BFS)" },
  { value: "dijkstra", label: "다익스트라" },
  { value: "prefix_sum", label: "누적 합" },
  { value: "segtree", label: "세그먼트 트리" },
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

export const mockRoadmapProblems: Record<string, string[]> = {
  "rm-frontend-core": ["p-1001", "p-2557", "p-1260"],
  "rm-two-pointer": ["p-1806", "p-14500"],
};

export function getMockRoadmaps(): Roadmap[] {
  return mockRoadmaps.map((roadmap) => ({ ...roadmap }));
}

export function getMockProblems(): Problem[] {
  return mockProblems.map((problem) => ({
    ...problem,
    tags: [...problem.tags],
  }));
}

export function getMockRoadmapById(roadmapId: string): Roadmap | null {
  const roadmap = mockRoadmaps.find((item) => item.id === roadmapId);
  return roadmap ? { ...roadmap } : null;
}

export function getMockProblemsByRoadmapId(roadmapId: string): Problem[] {
  const ids = mockRoadmapProblems[roadmapId] ?? [];
  const idSet = new Set(ids);
  return mockProblems
    .filter((problem) => idSet.has(problem.id))
    .map((problem) => ({ ...problem, tags: [...problem.tags] }));
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
  if (preset === "all") return true;
  if (preset === "1-5") return level >= 1 && level <= 5;
  if (preset === "6-10") return level >= 6 && level <= 10;
  if (preset === "11-15") return level >= 11 && level <= 15;
  if (preset === "16-20") return level >= 16 && level <= 20;
  if (preset === "21-25") return level >= 21 && level <= 25;
  return level >= 26 && level <= 30;
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
