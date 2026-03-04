"use client";

import { getTierColor, TIER_LABEL } from "@/lib/status/solvedac";

interface Member {
  handle: string;
  role: string;
  tier: number;
  tierName: string;
  rating: number;
  solvedCount: number;
}

export default function MemberRanking({ members }: { members: Member[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#EAEAEA]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F5F8FF] text-[#666]">
            <th className="py-3 px-4 text-left font-medium">#</th>
            <th className="py-3 px-4 text-left font-medium">핸들</th>
            <th className="py-3 px-4 text-left font-medium">티어</th>
            <th className="py-3 px-4 text-right font-medium">레이팅</th>
            <th className="py-3 px-4 text-right font-medium">풀이 수</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => {
            const color = getTierColor(m.tierName);
            return (
              <tr
                key={m.handle}
                className="border-t border-[#EAEAEA] hover:bg-[#F5F8FF] transition-colors"
              >
                <td className="py-3 px-4 text-[#999]">{i + 1}</td>
                <td className="py-3 px-4 font-medium text-[#111]">
                  {m.handle}
                  {m.role === "OWNER" && (
                    <span className="ml-2 text-xs text-[#F59E0B]">팀장</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold" style={{ color }}>
                    {TIER_LABEL[m.tier] ?? "?"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-[#111]">{m.rating.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-[#666]">{m.solvedCount.toLocaleString()}</td>
              </tr>
            );
          })}
          {members.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-[#999]">
                멤버가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
