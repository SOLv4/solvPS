"use client";

interface LevelGroup {
  label: string;
  solved: number;
  total: number;
  color: string;
  pct: number;
}

const BLUE_SHADES = ["#0046FE", "#1A56FE", "#2E67FE", "#5585FE", "#7DA3FE"];

export default function LevelHistogram({ data }: { data: LevelGroup[] }) {
  const maxSolved = Math.max(...data.map((d) => d.solved), 1);

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-gray-700">{d.label}</span>
            <span className="text-gray-400 text-xs">
              {d.solved}문제
              <span className="text-gray-300 ml-1">/ {d.total.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-4 bg-blue-50 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: `${(d.solved / maxSolved) * 100}%`,
                backgroundColor: BLUE_SHADES[i] ?? "#0046FE",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
