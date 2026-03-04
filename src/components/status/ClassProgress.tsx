"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ClassStat {
  class: number;
  total: number;
  totalSolved: number;
  essentials: number;
  essentialSolved: number;
  decoration: string | null;
  pct: number;
}

interface NextClassInfo {
  class: number;
  essentialLeft: number;
  totalLeft: number;
}

export default function ClassProgress({
  data,
  nextClassInfo,
}: {
  data: ClassStat[];
  nextClassInfo: NextClassInfo | null;
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: `C${item.class}`,
    essentialPct: item.essentials > 0 ? Math.round((item.essentialSolved / item.essentials) * 100) : 0,
  }));

  const focusClass = nextClassInfo
    ? chartData.find((item) => item.class === nextClassInfo.class) ?? chartData[chartData.length - 1]
    : chartData[chartData.length - 1];

  const focusProgress = focusClass?.pct ?? 100;
  const gaugeData = [{ name: "progress", value: focusProgress, fill: "#1E56F0" }];

  return (
    <div className="space-y-5">
      <div className="grid items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-[#F6FAFF] to-white p-3.5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative h-40">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart data={gaugeData} innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
              <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#E4EDFF" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-[#1248DA]">{focusProgress}%</p>
            <p className="text-xs text-slate-500">
              {nextClassInfo ? `CLASS ${nextClassInfo.class}` : "완료"}
            </p>
          </div>
        </div>

        {nextClassInfo ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">CLASS {nextClassInfo.class} 달성까지</p>
            <p className="text-sm text-slate-600">
              에센셜 <span className="font-semibold text-[#1248DA]">{nextClassInfo.essentialLeft}문제</span> 남음
            </p>
            <p className="text-xs text-slate-500">전체 남은 문제: {nextClassInfo.totalLeft}문제</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">축하합니다, CLASS 목표 완료</p>
            <p className="text-xs text-slate-500">다음 시즌 목표를 새로 설정해보세요.</p>
          </div>
        )}
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 6, left: -4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E7EEFF" />
            <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              cursor={{ fill: "rgba(236, 244, 255, 0.7)" }}
              contentStyle={{
                border: "1px solid #D9E6FF",
                borderRadius: 12,
                background: "rgba(255,255,255,0.97)",
                boxShadow: "0 12px 30px -24px rgba(15,70,216,0.6)",
              }}
              formatter={(value, name, item) => {
                const payload = item?.payload as (typeof chartData)[number] | undefined;
                if (name === "pct") {
                  return payload ? [`${value}% (${payload.totalSolved}/${payload.total})`, "전체 진행률"] : [`${value}%`, "전체 진행률"];
                }
                return payload
                  ? [`${value}% (${payload.essentialSolved}/${payload.essentials})`, "에센셜 진행률"]
                  : [`${value}%`, "에센셜 진행률"];
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: "#64748B", paddingBottom: 8 }}
              formatter={(value) => (value === "pct" ? "전체 진행률" : "에센셜 진행률")}
            />
            <Bar dataKey="pct" fill="#1E56F0" radius={[6, 6, 0, 0]} />
            <Bar dataKey="essentialPct" fill="#9CB8FF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
