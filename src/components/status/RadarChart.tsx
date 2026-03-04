"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

interface RadarTag {
  tag: string;
  name: string;
  solved: number;
  total: number;
  solveRate: number;
}

export default function AlgoRadarChart({ data }: { data: RadarTag[] }) {
  const chartData = data.map((d) => ({
    subject: d.name,
    solved: d.solved,
    fullMark: Math.max(...data.map((x) => x.solved)),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
        <PolarGrid stroke="#DBEAFE" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B7280", fontSize: 11 }} />
        <Radar
          name="풀이 수"
          dataKey="solved"
          stroke="#0046FE"
          fill="#0046FE"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid #DBEAFE", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,70,254,0.08)" }}
          labelStyle={{ color: "#111827", fontWeight: 600 }}
          formatter={(value) => [`${value}문제`, "풀이 수"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
