import { NextRequest } from "next/server";
import { getUserInfo, getTagStats, TIER_NAME } from "@/lib/status/solvedac";

const MAJOR_TAGS = [
  { key: "implementation", name: "구현" },
  { key: "math", name: "수학" },
  { key: "dp", name: "DP" },
  { key: "greedy", name: "그리디" },
  { key: "graphs", name: "그래프" },
  { key: "graph_traversal", name: "그래프 탐색" },
  { key: "trees", name: "트리" },
  { key: "string", name: "문자열" },
  { key: "sorting", name: "정렬" },
  { key: "binary_search", name: "이분탐색" },
  { key: "bfs", name: "BFS" },
  { key: "dfs", name: "DFS" },
  { key: "segtree", name: "세그트리" },
  { key: "data_structures", name: "자료구조" },
  { key: "two_pointer", name: "투포인터" },
];

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  const rival = req.nextUrl.searchParams.get("rival");
  if (!handle || !rival) return Response.json({ error: "handle, rival 필요" }, { status: 400 });

  try {
    const [meUser, meStats, rivalUser, rivalStats] = await Promise.all([
      getUserInfo(handle),
      getTagStats(handle),
      getUserInfo(rival),
      getTagStats(rival),
    ]);

    const meMap: Record<string, number> = {};
    for (const s of meStats) meMap[s.tag.key] = s.solved;

    const rivalMap: Record<string, number> = {};
    for (const s of rivalStats) rivalMap[s.tag.key] = s.solved;

    const comparison = MAJOR_TAGS.map(({ key, name }) => ({
      tag: key,
      name,
      me: meMap[key] ?? 0,
      rival: rivalMap[key] ?? 0,
      diff: (meMap[key] ?? 0) - (rivalMap[key] ?? 0),
    }));

    return Response.json({
      me: { handle: meUser.handle, tier: meUser.tier, tierName: TIER_NAME[meUser.tier], rating: meUser.rating },
      rival: { handle: rivalUser.handle, tier: rivalUser.tier, tierName: TIER_NAME[rivalUser.tier], rating: rivalUser.rating },
      comparison,
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
