import {
  getUserInfo,
  getTagStats,
  getLevelStats,
  getClassStats,
  getTop100,
  getSiteStats,
  TIER_NAME,
} from "@/lib/status/solvedac";
import type { StatsData } from "./types";

const META_TAGS = new Set(["ad_hoc", "misc"]);

const TIER_GROUPS = [
  { label: "브론즈",    range: [1, 5],   color: "#ad5600" },
  { label: "실버",     range: [6, 10],  color: "#435f7a" },
  { label: "골드",     range: [11, 15], color: "#ec9a00" },
  { label: "플래티넘",  range: [16, 20], color: "#27e2a4" },
  { label: "다이아",   range: [21, 25], color: "#00b4fc" },
  { label: "루비",     range: [26, 30], color: "#ff0062" },
] as const;

export async function getStatusStats(handle: string): Promise<StatsData> {
  const [user, tagStats, levelStats, classStats, top100, siteStats] = await Promise.all([
    getUserInfo(handle),
    getTagStats(handle),
    getLevelStats(handle),
    getClassStats(handle),
    getTop100(handle),
    getSiteStats(),
  ]);

  const radarTags = tagStats
    .filter((s) => !META_TAGS.has(s.tag.key) && s.solved > 0)
    .sort((a, b) => b.solved - a.solved)
    .slice(0, 8)
    .map((s) => ({
      tag: s.tag.key,
      name: s.tag.displayNames.find((d) => d.language === "ko")?.name ?? s.tag.key,
      solved: s.solved,
      total: s.total,
      solveRate: Math.round((s.solved / s.total) * 1000) / 10,
    }));

  const weakTags = tagStats
    .filter((s) => !META_TAGS.has(s.tag.key) && s.total >= 100)
    .map((s) => ({
      tag: s.tag.key,
      name: s.tag.displayNames.find((d) => d.language === "ko")?.name ?? s.tag.key,
      solved: s.solved,
      total: s.total,
      tried: s.tried,
      solveRate: Math.round((s.solved / s.total) * 1000) / 10,
    }))
    .sort((a, b) => a.solveRate - b.solveRate)
    .slice(0, 6);

  const levelHistogram = TIER_GROUPS.map(({ label, range, color }) => {
    const [min, max] = range;
    const solved = levelStats
      .filter((d) => d.level >= min && d.level <= max)
      .reduce((acc, d) => acc + d.solved, 0);
    const total = levelStats
      .filter((d) => d.level >= min && d.level <= max)
      .reduce((acc, d) => acc + d.total, 0);
    return { label, solved, total, color, pct: total > 0 ? Math.round((solved / total) * 100) : 0 };
  });

  const classProgress = classStats.slice(0, 6).map((c) => ({
    class: c.class,
    total: c.total,
    totalSolved: c.totalSolved,
    essentials: c.essentials,
    essentialSolved: c.essentialSolved,
    decoration: c.decoration,
    pct: Math.round((c.totalSolved / c.total) * 100),
  }));

  const nextClass = classStats.find(
    (c) => c.decoration !== "gold" && c.decoration !== "silver"
  );
  const nextClassInfo = nextClass
    ? {
        class: nextClass.class,
        essentialLeft: nextClass.essentials - nextClass.essentialSolved,
        totalLeft: nextClass.total - nextClass.totalSolved,
      }
    : null;

  const tryCounts = top100.map((p) => p.averageTries);
  const styleData = {
    easy: tryCounts.filter((t) => t <= 1.5).length,
    normal: tryCounts.filter((t) => t > 1.5 && t <= 3).length,
    hard: tryCounts.filter((t) => t > 3 && t <= 5).length,
    veryHard: tryCounts.filter((t) => t > 5).length,
    topTags: (() => {
      const counter: Record<string, number> = {};
      for (const p of top100) {
        for (const t of p.tags) {
          const name = t.displayNames.find((d) => d.language === "ko")?.name ?? t.key;
          counter[name] = (counter[name] ?? 0) + 1;
        }
      }
      return Object.entries(counter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    })(),
    hardestLevel: Math.max(...top100.map((p) => p.level)),
    styleLabel: (() => {
      const total = top100.length;
      const hardRatio = (tryCounts.filter((t) => t > 3).length / total) * 100;
      const topTagKeys = top100.flatMap((p) => p.tags.map((t) => t.key));
      const hasGraph = topTagKeys.filter((k) => ["graphs", "graph_traversal", "trees"].includes(k)).length > 15;
      const hasDP = topTagKeys.filter((k) => k === "dp").length > 15;
      const hasImpl = topTagKeys.filter((k) => k === "implementation").length > 20;

      if (hardRatio > 20) return "끈기형 🧗";
      if (hasGraph) return "그래프 마스터 🕸";
      if (hasDP) return "DP 전문가 🧠";
      if (hasImpl) return "구현 특화형 ⚙️";
      return "균형 성장형 ⚖️";
    })(),
  };

  return {
    user: {
      handle: user.handle,
      tier: user.tier,
      tierName: TIER_NAME[user.tier] ?? "Unknown",
      rating: user.rating,
      solvedCount: user.solvedCount,
      maxStreak: user.maxStreak,
    },
    radarTags,
    weakTags,
    levelHistogram,
    classProgress,
    nextClassInfo,
    styleData,
    siteInfo: {
      totalUsers: siteStats.userCount,
      totalProblems: siteStats.problemCount,
    },
  };
}
