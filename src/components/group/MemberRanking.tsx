"use client";

import { Crown, Target, TrendingUp } from "lucide-react";
import { getTierColor, TIER_LABEL } from "@/lib/status/solvedac";

interface Member {
  handle: string;
  role: string;
  tier: number;
  tierName: string;
  rating: number;
  solvedCount: number;
}

const RANK_COLORS = [
  { border: "border-l-[#D97706]", bg: "bg-[#FFFBF0]", num: "text-[#B45309] bg-[#FEF3C7]" },
  { border: "border-l-[#6366F1]", bg: "bg-[#F9F9FF]", num: "text-[#4338CA] bg-[#EEF2FF]" },
  { border: "border-l-[#71717A]", bg: "bg-[#FAFAFA]", num: "text-[#3F3F46] bg-[#F4F4F5]" },
];

export default function MemberRanking({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
        멤버가 없습니다.
      </div>
    );
  }

  const maxSolved = Math.max(...members.map((m) => m.solvedCount), 1);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      {/* 테이블 헤더 */}
      <div className="grid grid-cols-[40px_1fr_auto] items-center border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid-cols-[40px_1fr_120px_120px]">
        <span>#</span>
        <span>핸들 / 티어</span>
        <span className="hidden text-right sm:block">레이팅</span>
        <span className="text-right">풀이 수</span>
      </div>

      {members.map((member, index) => {
        const tierColor = getTierColor(member.tierName);
        const isTop = index < 3;
        const rc = isTop ? RANK_COLORS[index] : null;
        const solvedPct = Math.round((member.solvedCount / maxSolved) * 100);

        return (
          <div
            key={member.handle}
            className={`grid grid-cols-[40px_1fr_auto] items-center border-b border-gray-100 px-4 py-3 last:border-b-0 transition-colors hover:bg-gray-50 sm:grid-cols-[40px_1fr_120px_120px] ${isTop ? `border-l-2 ${rc!.border} ${rc!.bg}` : "border-l-2 border-l-transparent"}`}
          >
            {/* 순위 */}
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${isTop ? rc!.num : "bg-gray-100 text-gray-400"}`}>
              {index + 1}
            </span>

            {/* 핸들 + 티어 + 역할 */}
            <div className="min-w-0 pl-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-800 truncate">@{member.handle}</span>
                {member.role === "OWNER" && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown size={9} />팀장
                  </span>
                )}
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                >
                  {TIER_LABEL[member.tier] ?? "?"}
                </span>
              </div>
              {/* 풀이 진행 바 */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-[#0F46D8]"
                    style={{ width: `${solvedPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 레이팅 */}
            <div className="hidden text-right sm:block">
              <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-700">
                <TrendingUp size={11} className="text-gray-300" />
                {member.rating.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400">pts</p>
            </div>

            {/* 풀이 수 */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-sm font-semibold text-[#0F46D8]">
                <Target size={11} className="text-[#0F46D8]/40" />
                {member.solvedCount.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-400">문제</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
