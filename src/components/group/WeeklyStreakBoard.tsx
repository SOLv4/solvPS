"use client";

export interface WeeklyMember {
  userId: number;
  name: string;
  handle: string;
  role: string;
  dailySolved: number[];
  weeklySolved: number;
  activeDays: number;
  currentStreak: number;
  difficultyScore: number;
  streakScore: number;
  consistencyBonus: number;
  weeklyScore: number;
}

const PODIUM_STYLE = {
  1: {
    card: "bg-gradient-to-b from-[#FFF8DB] to-[#FDE68A] border-[#EAB308] h-[220px]",
    rank: "border-[#D97706] text-[#92400E]",
  },
  2: {
    card: "bg-white border-gray-200 h-[200px]",
    rank: "border-[#9CA3AF] text-[#4B5563]",
  },
  3: {
    card: "bg-white border-gray-200 h-[200px]",
    rank: "border-[#C2410C] text-[#9A3412]",
  },
} as const;

function cellClass(v: number) {
  if (v <= 0) return "bg-slate-200 border-slate-300";
  if (v === 1) return "bg-[#93C5FD] border-[#60A5FA]";
  if (v === 2) return "bg-[#2563EB] border-[#1D4ED8]";
  if (v === 3) return "bg-[#1D4ED8] border-[#1E40AF]";
  return "bg-[#0F46D8] border-[#1E3A8A]";
}

function scoreText(score: number) {
  return `+${score.toFixed(1)}`;
}

export default function WeeklyStreakBoard({
  labels,
  members,
  loading,
}: {
  labels: string[];
  members: WeeklyMember[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-50 border border-slate-100 mt-3"
            />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-slate-500">집계 가능한 팀원 활동 데이터가 없습니다.</p>;
  }

  const sorted = [...members].sort((a, b) => b.weeklyScore - a.weeklyScore);
  const podium = [sorted[1], sorted[0], sorted[2]].filter(Boolean) as WeeklyMember[];
  const rest = sorted.slice(3);
  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-center">
        {podium.map((m) => {
          const rank = sorted.findIndex((x) => x.userId === m.userId) + 1;
          const style = PODIUM_STYLE[rank as 1 | 2 | 3];
          return (
            <div
              key={m.userId}
              className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm ${style.card} flex flex-col items-center justify-center text-center`}
            >
              <div className="flex flex-col items-center">
                <span className={`mb-3 rounded-full border bg-white px-2.5 py-0.5 text-[11px] font-bold ${style.rank}`}>
                  {rank}등
                </span>
                <p className="max-w-full truncate text-sm font-bold text-slate-800">{m.name}</p>
                <p className="mt-1 text-2xl font-black text-[#0F46D8]">
                  {scoreText(m.weeklyScore)}
                </p>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                  {dayNames.map((d, i) => (
                    <span key={`${m.userId}-day-${labels[i] ?? d}`} className="w-5 text-center">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {m.dailySolved.map((v: number, i: number) => (
                    <div
                      key={`${m.userId}-podium-${labels[i] ?? i}`}
                      className={`h-5 w-5 rounded-[7px] border ${cellClass(v)}`}
                      title={`${dayNames[i]} · ${v}문제`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rank List</p>
          </div>
          <div className="divide-y divide-gray-100">
            {rest.map((m) => {
              const rank = sorted.findIndex((x) => x.userId === m.userId) + 1;
              return (
                <div
                  key={m.userId}
                  className="grid grid-cols-[48px_1fr_1fr_100px] items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-center">
                    <p className="text-lg font-black text-slate-700">{rank}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.role === "OWNER" ? "팀장" : "멤버"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.dailySolved.map((v: number, i: number) => (
                      <div
                        key={`${m.userId}-list-${i}`}
                        className={`h-4 w-4 rounded-[6px] border ${cellClass(v)}`}
                      />
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">{scoreText(m.weeklyScore)}</p>
                    <p className="text-[9px] text-slate-400">총 풀이 {m.weeklySolved}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
