"use client";

import { Crown } from "lucide-react";
import { motion } from "framer-motion";

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
    card: "bg-gradient-to-b from-[#FFF8DB] to-[#FDE68A] border-[#EAB308] h-[248px]",
    crown: "text-[#B45309]",
    rank: "border-[#D97706] text-[#92400E]",
    crownSize: 36,
  },
  2: {
    card: "bg-white border-gray-200 h-[224px]",
    crown: "text-[#4B5563]",
    rank: "border-[#9CA3AF] text-[#4B5563]",
    crownSize: 30,
  },
  3: {
    card: "bg-white border-gray-200 h-[224px]",
    crown: "text-[#9A3412]",
    rank: "border-[#C2410C] text-[#9A3412]",
    crownSize: 24,
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

const listContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
    return <p className="text-sm text-slate-500">주간 팀 활동을 집계하는 중...</p>;
  }

  if (members.length === 0) {
    return <p className="text-sm text-slate-500">이번 주 집계할 팀 활동 데이터가 없습니다.</p>;
  }

  const first = members[0] ?? null;
  const second = members[1] ?? null;
  const third = members[2] ?? null;
  const rest = members.slice(3);

  const podium = [second, first, third].filter(Boolean) as WeeklyMember[];
  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
  const podiumDelayMap: Record<number, number> = { 1: 0.12, 2: 0.02, 3: 0.2 };

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {podium.map((m) => {
          const rank = members.findIndex((x) => x.userId === m.userId) + 1;
          const style = PODIUM_STYLE[rank as 1 | 2 | 3];
          const isFirst = rank === 1;
          return (
            <motion.div
              layout
              key={m.userId}
              className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${style.card} ${isFirst ? "sm:-mt-3" : "sm:mt-3"}`}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: podiumDelayMap[rank] ?? 0.1,
                type: "spring",
                stiffness: 170,
                damping: 18,
              }}
              whileHover={{ y: -6, scale: 1.015 }}
              whileTap={{ scale: 0.995 }}
            >
              <motion.div
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-center"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  animate={{ rotate: [0, -1.5, 1.5, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Crown size={style.crownSize} className={`mx-auto ${style.crown}`} />
                </motion.div>
                <span className={`mt-0.5 inline-block rounded-full border bg-white px-2 py-0.5 text-[11px] font-bold ${style.rank}`}>
                  {rank}등
                </span>
              </motion.div>

              <div className="mt-6 flex flex-col items-center text-center">
                <p className="max-w-full truncate text-base font-extrabold text-slate-800">{m.name}</p>
                <motion.p
                  className="mt-1 text-3xl font-black text-[#0F46D8]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (podiumDelayMap[rank] ?? 0.1) + 0.18, duration: 0.35 }}
                >
                  {scoreText(m.weeklyScore)}
                </motion.p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                  {dayNames.map((d, i) => (
                    <span key={`${m.userId}-day-${labels[i] ?? d}`} className="w-6 text-center">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  {m.dailySolved.map((v, i) => (
                    <motion.div
                      key={`${m.userId}-podium-${labels[i] ?? i}`}
                      className={`h-6 w-6 rounded-md border ${cellClass(v)}`}
                      title={`${dayNames[i]} · ${v}문제`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0, scale: v > 0 ? [1, 1.06, 1] : 1 }}
                      transition={{
                        delay: (podiumDelayMap[rank] ?? 0.1) + i * 0.03,
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        layout
        className="rounded-2xl border border-gray-100 bg-white/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.35 }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rank List</p>
          <p className="text-xs text-slate-400">{rest.length}명</p>
        </div>

        <motion.div
          className="divide-y divide-gray-100"
          variants={listContainerVariants}
          initial="hidden"
          animate="show"
        >
          {rest.map((m) => {
            const rank = members.findIndex((x) => x.userId === m.userId) + 1;
            return (
              <motion.div
                layout
                variants={listItemVariants}
                key={m.userId}
                className="grid grid-cols-[56px_1fr_1fr_140px] items-center gap-3 px-4 py-3"
                whileHover={{ backgroundColor: "rgba(247,249,255,0.9)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <p className="text-xl font-black text-slate-700">{rank}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{m.currentStreak}일</p>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.role === "OWNER" ? "팀장" : "멤버"}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      {dayNames.map((d, i) => (
                        <span key={`${m.userId}-list-day-${labels[i] ?? d}`} className="w-5 text-center">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.dailySolved.map((v, i) => (
                        <motion.div
                          key={`${m.userId}-list-${labels[i] ?? i}`}
                          className={`h-5 w-5 rounded border ${cellClass(v)}`}
                          title={`${dayNames[i]} · ${v}문제`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02, duration: 0.22 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <motion.p
                    className="text-3xl font-black text-slate-900"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {scoreText(m.weeklyScore)}
                  </motion.p>
                  <p className="text-[10px] text-slate-400">주간 풀이 {m.weeklySolved}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
