"use client";

import { Crown, Medal, Target } from "lucide-react";
import { getTierColor, TIER_LABEL } from "@/lib/status/solvedac";

interface Member {
  handle: string;
  role: string;
  tier: number;
  tierName: string;
  rating: number;
  solvedCount: number;
}

const rankAccent = (index: number) => {
  if (index === 0) return "from-[#FFF9E8] to-[#FFF1C9] border-[#F2D387]";
  if (index === 1) return "from-[#F5F8FF] to-[#E6EEFF] border-[#BDD2FF]";
  if (index === 2) return "from-[#F8F8F8] to-[#EFEFEF] border-[#D9D9D9]";
  return "from-white to-[#f9fbff] border-[#E4ECFF]";
};

export default function MemberRanking({ members }: { members: Member[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">
        멤버가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member, index) => {
        const color = getTierColor(member.tierName);
        const top = index < 3;

        return (
          <div
            key={member.handle}
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-r px-4 py-3 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-42px_rgba(0,70,254,0.65)] ${rankAccent(index)}`}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#0F46D8] to-[#6B92FF] opacity-60" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full border border-blue-100 bg-white/90 text-sm font-black text-slate-700">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">@{member.handle}</p>
                    {member.role === "OWNER" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        <Crown size={11} />
                        팀장
                      </span>
                    )}
                    {top && member.role !== "OWNER" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        <Medal size={11} />
                        TOP {index + 1}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    티어 <span className="font-semibold" style={{ color }}>{TIER_LABEL[member.tier] ?? "?"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="rounded-xl border border-blue-100 bg-white/70 px-3 py-1.5 text-right backdrop-blur-sm">
                  <p className="text-[11px] text-slate-500">레이팅</p>
                  <p className="text-sm font-bold text-[#0F46D8]">{member.rating.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-white/70 px-3 py-1.5 text-right backdrop-blur-sm">
                  <p className="text-[11px] text-slate-500">풀이 수</p>
                  <p className="flex items-center justify-end gap-1 text-sm font-bold text-[#0F46D8]">
                    <Target size={12} />
                    {member.solvedCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
