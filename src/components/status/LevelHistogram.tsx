"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LevelGroup {
  label: string;
  solved: number;
  total: number;
  color: string;
  pct: number;
}

const formatCompact = (value: number) => {
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
};

export default function LevelHistogram({ data }: { data: LevelGroup[] }) {
  const chartData = data.map((d) => ({
    ...d,
    unsolved: Math.max(d.total - d.solved, 0),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[310px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-[#f8fbff] text-sm text-slate-500">
        난이도 데이터가 없습니다.
      </div>
    );
  }

  const strongestGroup = chartData.reduce((best, cur) => (cur.solved > best.solved ? cur : best), chartData[0]);
  const bestRateGroup = chartData.reduce((best, cur) => (cur.pct > best.pct ? cur : best), chartData[0]);

  return (
    <div className="space-y-4">
      <div className="h-[310px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="level-solved-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E56F0" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#4C7DFF" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E7EEFF" />
            <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="count"
              tickFormatter={formatCompact}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <YAxis
              yAxisId="rate"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              cursor={{ fill: "rgba(236, 244, 255, 0.7)" }}
              contentStyle={{
                border: "1px solid #D9E6FF",
                borderRadius: 12,
                background: "rgba(255,255,255,0.97)",
                boxShadow: "0 12px 30px -24px rgba(15,70,216,0.6)",
              }}
              formatter={(value, name) => {
                if (name === "solved") return [`${Number(value).toLocaleString()}문제`, "푼 문제"];
                if (name === "unsolved") return [`${Number(value).toLocaleString()}문제`, "남은 문제"];
                return [`${value}%`, "풀이 비율"];
              }}
              labelFormatter={(label) => `${label} 구간`}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "#64748B", paddingBottom: 8 }}
              formatter={(value) => {
                if (value === "solved") return "푼 문제";
                if (value === "unsolved") return "남은 문제";
                return "풀이 비율";
              }}
            />
            <Bar yAxisId="count" dataKey="solved" stackId="total" fill="url(#level-solved-gradient)" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="count" dataKey="unsolved" stackId="total" fill="#DCE7FF" radius={[8, 8, 0, 0]} />
            <Line
              yAxisId="rate"
              type="monotone"
              dataKey="pct"
              stroke="#0F46D8"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0F46D8" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-blue-100 bg-[#F8FBFF] px-3.5 py-3">
          <p className="text-xs text-slate-500">가장 많이 푼 난이도</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{strongestGroup.label}</p>
          <p className="text-xs text-[#1E56F0]">{strongestGroup.solved.toLocaleString()}문제 해결</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-[#F8FBFF] px-3.5 py-3">
          <p className="text-xs text-slate-500">가장 높은 커버리지</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{bestRateGroup.label}</p>
          <p className="text-xs text-[#1E56F0]">{bestRateGroup.pct}% 해결률</p>
        </div>
      </div>
    </div>
  );
}
