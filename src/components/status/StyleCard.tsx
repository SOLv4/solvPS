"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StyleData {
  easy: number;
  normal: number;
  hard: number;
  veryHard: number;
  topTags: { name: string; count: number }[];
  hardestLevel: number;
  styleLabel: string;
}

const TIER_LABEL: Record<number, string> = {
  10: "S1",
  11: "G5",
  12: "G4",
  13: "G3",
  14: "G2",
  15: "G1",
  16: "P5",
  17: "P4",
  18: "P3",
  19: "P2",
  20: "P1",
  21: "D5",
  22: "D4",
  23: "D3",
  24: "D2",
  25: "D1",
};

const DIFFICULTY = [
  { key: "easy", label: "쉬움", color: "#A4BFFF" },
  { key: "normal", label: "보통", color: "#5D87FF" },
  { key: "hard", label: "어려움", color: "#1E56F0" },
  { key: "veryHard", label: "매우 어려움", color: "#0A2FA8" },
] as const;

export default function StyleCard({ data }: { data: StyleData }) {
  const total = data.easy + data.normal + data.hard + data.veryHard;
  const styleParts = data.styleLabel.trim().split(" ");
  const styleIcon = styleParts.length > 1 ? styleParts[styleParts.length - 1] : "📈";
  const styleName = styleParts.length > 1 ? styleParts.slice(0, -1).join(" ") : data.styleLabel;

  const pieData = DIFFICULTY.map((item) => ({
    ...item,
    value: data[item.key],
    pct: total > 0 ? Math.round((data[item.key] / total) * 100) : 0,
  })).filter((item) => item.value > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-[#F7FAFF] to-white p-3.5">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E8F0FF] text-2xl">{styleIcon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{styleName}</p>
          <p className="text-xs text-slate-500">상위 100문제 기준으로 계산된 풀이 성향</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-blue-100 bg-white p-3.5">
          <p className="mb-2 text-xs font-medium text-slate-500">난이도 분포</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={54}
                  outerRadius={82}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: "1px solid #D9E6FF",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.97)",
                    boxShadow: "0 12px 30px -24px rgba(15,70,216,0.6)",
                  }}
                  formatter={(value, name, item) => {
                    const payload = item?.payload as (typeof pieData)[number] | undefined;
                    if (!payload) return [`${value}개`, String(name)];
                    return [`${value}개 (${payload.pct}%)`, String(name)];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 grid gap-1.5">
            {pieData.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-semibold text-slate-700">
                  {item.value}개 <span className="text-slate-400">({item.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-3.5">
          <p className="mb-2 text-xs font-medium text-slate-500">주력 알고리즘 태그</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topTags} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal stroke="#E7EEFF" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(236, 244, 255, 0.7)" }}
                  contentStyle={{
                    border: "1px solid #D9E6FF",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.97)",
                    boxShadow: "0 12px 30px -24px rgba(15,70,216,0.6)",
                  }}
                  formatter={(value) => [`${value}회`, "등장 횟수"]}
                />
                <Bar dataKey="count" radius={[0, 7, 7, 0]} fill="#3A6EFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.topTags.map((item) => (
              <span key={item.name} className="rounded-full border border-blue-200 bg-[#F5F8FF] px-2.5 py-1 text-xs text-[#1E56F0]">
                {item.name} {item.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-[#F8FBFF] px-3.5 py-3">
        <p className="text-xs text-slate-500">최고 난이도</p>
        <p className="text-sm font-semibold text-[#1248DA]">{TIER_LABEL[data.hardestLevel] ?? data.hardestLevel}</p>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <p className="text-xs text-slate-500">top 100 문제 기준</p>
      </div>
    </div>
  );
}
