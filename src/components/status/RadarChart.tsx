"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
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

interface Props {
  data: RadarTag[];
}

export default function AlgoRadarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    subject: d.name,
    solved: d.solved,
    fullMark: Math.max(...data.map((x) => x.solved)),
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
        />
        <Radar
          name="풀이 수"
          dataKey="solved"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
          labelStyle={{ color: "#f3f4f6", fontWeight: 600 }}
          formatter={(value) => [`${value}문제`, "풀이 수"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
