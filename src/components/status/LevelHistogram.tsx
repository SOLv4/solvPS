"use client";

interface LevelGroup {
  label: string;
  solved: number;
  total: number;
  color: string;
  pct: number;
}

export default function LevelHistogram({ data }: { data: LevelGroup[] }) {
  const maxSolved = Math.max(...data.map((d) => d.solved), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium" style={{ color: d.color }}>{d.label}</span>
            <span className="text-gray-500">
              {d.solved}문제
              <span className="text-gray-700 ml-1">/ {d.total.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-5 bg-gray-800 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: `${(d.solved / maxSolved) * 100}%`,
                backgroundColor: d.color,
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
