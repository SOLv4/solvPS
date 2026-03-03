import Anthropic from "@anthropic-ai/sdk";
import { getUserInfo, getTagStats, searchProblems, TIER_LABEL } from "./solvedac";

// Claude에게 제공할 Tool 정의
export const tools: Anthropic.Tool[] = [
  {
    name: "get_user_info",
    description: "solved.ac 유저의 기본 정보를 가져옵니다 (티어, 레이팅, 총 풀이 수).",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "BOJ 핸들명" },
      },
      required: ["handle"],
    },
  },
  {
    name: "get_tag_stats",
    description:
      "유저의 알고리즘 태그별 풀이 통계를 가져옵니다. " +
      "각 태그마다 전체 문제 수(total), 푼 문제 수(solved), 시도했지만 실패한 수(tried)를 반환합니다. " +
      "취약 태그 파악에 활용하세요.",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "BOJ 핸들명" },
      },
      required: ["handle"],
    },
  },
  {
    name: "search_problems",
    description:
      "특정 알고리즘 태그와 난이도 범위에서 해당 유저가 아직 풀지 않은 문제를 검색합니다. " +
      "약점 태그에 맞는 연습 문제를 찾을 때 사용하세요. " +
      "tier 형식: b5~b1(브론즈), s5~s1(실버), g5~g1(골드), p5~p1(플래티넘), d5~d1(다이아), r5~r1(루비)",
    input_schema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "태그 key (예: trees, dp, graphs, greedy)" },
        tier_min: { type: "string", description: "최소 난이도 (예: s3)" },
        tier_max: { type: "string", description: "최대 난이도 (예: g3)" },
        handle: { type: "string", description: "이미 푼 문제를 제외할 핸들" },
      },
      required: ["tag", "tier_min", "tier_max", "handle"],
    },
  },
];

// Tool 실행기 - Claude가 요청한 tool을 실제로 실행
export async function executeTool(
  toolName: string,
  toolInput: Record<string, string>
): Promise<string> {
  try {
    if (toolName === "get_user_info") {
      const user = await getUserInfo(toolInput.handle);
      return JSON.stringify({
        handle: user.handle,
        tier: user.tier,
        tierName: TIER_LABEL[user.tier] ?? "Unknown",
        rating: user.rating,
        solvedCount: user.solvedCount,
        maxStreak: user.maxStreak,
      });
    }

    if (toolName === "get_tag_stats") {
      const stats = await getTagStats(toolInput.handle);
      // 의미 있는 태그만 (전체 문제 10개 이상) 반환
      const filtered = stats
        .filter((s) => s.total >= 10)
        .map((s) => ({
          key: s.tag.key,
          nameKo: s.tag.displayNames.find((d) => d.language === "ko")?.name ?? s.tag.key,
          total: s.total,
          solved: s.solved,
          tried: s.tried,
          solveRate: Math.round((s.solved / s.total) * 100),
        }));
      return JSON.stringify(filtered);
    }

    if (toolName === "search_problems") {
      const problems = await searchProblems(
        toolInput.tag,
        toolInput.tier_min,
        toolInput.tier_max,
        toolInput.handle
      );
      return JSON.stringify(
        problems.map((p) => ({
          id: p.problemId,
          title: p.titleKo,
          level: TIER_LABEL[p.level] ?? p.level,
          url: `https://www.acmicpc.net/problem/${p.problemId}`,
        }))
      );
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
