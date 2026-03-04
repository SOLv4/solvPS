const BASE = "https://solved.ac/api/v3";
const HEADERS = { "User-Agent": "algo-weakness-analyzer/1.0" };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`solved.ac API error: ${res.status} ${path}`);
  return res.json();
}

export interface UserInfo {
  handle: string;
  tier: number;
  rating: number;
  solvedCount: number;
  maxStreak: number;
  rank?: number;
}

export interface TagStat {
  tag: {
    key: string;
    displayNames: { language: string; name: string }[];
    problemCount: number;
  };
  total: number;
  solved: number;
  tried: number;
  partial: number;
}

export interface LevelStat {
  level: number;
  solved: number;
  tried: number;
  partial: number;
  total: number;
}

export interface ClassStat {
  class: number;
  total: number;
  totalSolved: number;
  essentials: number;
  essentialSolved: number;
  decoration: string | null;
}

export interface TopProblem {
  problemId: number;
  titleKo: string;
  level: number;
  averageTries: number;
  tags: { key: string; displayNames: { language: string; name: string }[] }[];
}

export interface SiteStats {
  userCount: number;
  problemCount: number;
}

export interface Problem {
  problemId: number;
  titleKo: string;
  level: number;
  tags: { key: string }[];
}

export const TIER_LABEL: Record<number, string> = {
  0: "Unrated",
  1: "B5", 2: "B4", 3: "B3", 4: "B2", 5: "B1",
  6: "S5", 7: "S4", 8: "S3", 9: "S2", 10: "S1",
  11: "G5", 12: "G4", 13: "G3", 14: "G2", 15: "G1",
  16: "P5", 17: "P4", 18: "P3", 19: "P2", 20: "P1",
  21: "D5", 22: "D4", 23: "D3", 24: "D2", 25: "D1",
  26: "R5", 27: "R4", 28: "R3", 29: "R2", 30: "R1",
  31: "Master",
};

export const TIER_NAME: Record<number, string> = {
  0: "Unrated",
  1: "브론즈5", 2: "브론즈4", 3: "브론즈3", 4: "브론즈2", 5: "브론즈1",
  6: "실버5", 7: "실버4", 8: "실버3", 9: "실버2", 10: "실버1",
  11: "골드5", 12: "골드4", 13: "골드3", 14: "골드2", 15: "골드1",
  16: "플래티넘5", 17: "플래티넘4", 18: "플래티넘3", 19: "플래티넘2", 20: "플래티넘1",
  21: "다이아5", 22: "다이아4", 23: "다이아3", 24: "다이아2", 25: "다이아1",
  26: "루비5", 27: "루비4", 28: "루비3", 29: "루비2", 30: "루비1",
  31: "마스터",
};

export const TIER_COLOR: Record<string, string> = {
  브론즈: "#ad5600", 실버: "#435f7a", 골드: "#ec9a00",
  플래티넘: "#27e2a4", 다이아: "#00b4fc", 루비: "#ff0062", 마스터: "#b300e0",
};

export function getTierColor(tierName: string) {
  for (const [key, color] of Object.entries(TIER_COLOR)) {
    if (tierName.startsWith(key)) return color;
  }
  return "#6b7280";
}

export async function getUserInfo(handle: string): Promise<UserInfo> {
  return get<UserInfo>(`/user/show?handle=${handle}`);
}

export async function getTagStats(handle: string): Promise<TagStat[]> {
  const data = await get<{ items: TagStat[] }>(`/user/problem_tag_stats?handle=${handle}`);
  return data.items;
}

export async function getLevelStats(handle: string): Promise<LevelStat[]> {
  return get<LevelStat[]>(`/user/problem_stats?handle=${handle}`);
}

export async function getClassStats(handle: string): Promise<ClassStat[]> {
  return get<ClassStat[]>(`/user/class_stats?handle=${handle}`);
}

export async function getTop100(handle: string): Promise<TopProblem[]> {
  const data = await get<{ items: TopProblem[] }>(`/user/top_100?handle=${handle}`);
  return data.items;
}

export async function getSiteStats(): Promise<SiteStats> {
  return get<SiteStats>(`/site/stats`);
}

export async function searchProblems(
  tag: string,
  tierMin: string,
  tierMax: string,
  handle: string,
  limit = 5
): Promise<Problem[]> {
  const query = `tag:${tag} tier:${tierMin}..${tierMax} -solved_by:${handle}`;
  const params = new URLSearchParams({ query, sort: "level", direction: "asc", page: "1" });
  const data = await get<{ items: Problem[] }>(`/search/problem?${params}`);
  return data.items.slice(0, limit);
}
