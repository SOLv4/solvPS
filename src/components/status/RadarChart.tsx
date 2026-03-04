"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarTag {
  tag: string;
  name: string;
  solved: number;
  total: number;
  solveRate: number;
}

const truncate = (value: string, max = 7) => (value.length > max ? `${value.slice(0, max)}…` : value);

export default function AlgoRadarChart({ data }: { data: RadarTag[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-[#f8fbff] text-sm text-slate-500">
        태그 데이터가 충분하지 않습니다.
      </div>
    );
  }

  const maxSolved = Math.max(...data.map((d) => d.solved), 1);
  const chartData = data.map((d) => ({
    ...d,
    subject: d.name,
  }));

  return (
    <div className="space-y-4">
      <div className="h-[440px] rounded-2xl bg-gradient-to-b from-[#f8fbff] to-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 24, right: 36, bottom: 20, left: 36 }}>
            <defs>
              <linearGradient id="status-radar-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E67FE" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#0046FE" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="#DCE8FF" radialLines={false} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }}
              tickFormatter={(value) => truncate(String(value))}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxSolved]}
              tickCount={4}
              tick={{ fill: "#A3B2CC", fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              dataKey="solved"
              name="풀이 수"
              stroke="#0F46D8"
              fill="url(#status-radar-fill)"
              strokeWidth={2.5}
              dot={{ fill: "#0F46D8", r: 3 }}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                border: "1px solid #D9E6FF",
                borderRadius: 12,
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 12px 30px -24px rgba(15,70,216,0.6)",
              }}
              labelStyle={{ color: "#1E293B", fontWeight: 700 }}
              formatter={(_value, _name, item) => {
                const payload = item?.payload as (typeof chartData)[number] | undefined;
                if (!payload) return ["-", "풀이 수"];
                return [`${payload.solved}문제 (${payload.solveRate}%)`, "풀이 수"];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {chartData.map((tag, index) => (
          <div key={tag.tag} className="rounded-xl border border-blue-100 bg-white/85 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {index + 1}. {tag.name}
              </span>
              <span className="font-bold text-[#0F46D8]">{tag.solved}문제</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              전체 {tag.total.toLocaleString()}문제 · 풀이율 {tag.solveRate}%
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0F46D8] to-[#4C7DFF]"
                style={{ width: `${Math.max(8, (tag.solved / maxSolved) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
