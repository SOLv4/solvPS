"use client";

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
  10: "S1", 11: "G5", 12: "G4", 13: "G3", 14: "G2", 15: "G1",
  16: "P5", 17: "P4", 18: "P3", 19: "P2", 20: "P1",
  21: "D5", 22: "D4", 23: "D3", 24: "D2", 25: "D1",
};

export default function StyleCard({ data }: { data: StyleData }) {
  const total = data.easy + data.normal + data.hard + data.veryHard;
  const bars = [
    { label: "쉬움",     value: data.easy,     color: "#22c55e" },
    { label: "보통",     value: data.normal,   color: "#3b82f6" },
    { label: "어려움",   value: data.hard,     color: "#f59e0b" },
    { label: "매우 어려움", value: data.veryHard, color: "#ef4444" },
  ];

  return (
    <div className="space-y-5">
      {/* 스타일 레이블 */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{data.styleLabel.split(" ")[1]}</span>
        <div>
          <p className="text-white font-semibold">{data.styleLabel.split(" ")[0]}</p>
          <p className="text-gray-500 text-xs">top 100 문제 기준 분석</p>
        </div>
      </div>

      {/* 도전 난이도 분포 */}
      <div>
        <p className="text-xs text-gray-500 mb-2">문제 난이도 분포 (타인 평균 시도 횟수 기준)</p>
        <div className="flex h-6 rounded-lg overflow-hidden gap-0.5">
          {bars.map((b) =>
            b.value > 0 ? (
              <div
                key={b.label}
                className="h-full transition-all"
                style={{ width: `${(b.value / total) * 100}%`, backgroundColor: b.color }}
                title={`${b.label}: ${b.value}개`}
              />
            ) : null
          )}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: b.color }} />
              {b.label} {b.value}개
            </div>
          ))}
        </div>
      </div>

      {/* 주력 태그 */}
      <div>
        <p className="text-xs text-gray-500 mb-2">top 100 주력 알고리즘</p>
        <div className="flex flex-wrap gap-2">
          {data.topTags.map((t, i) => (
            <span
              key={t.name}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `rgba(59,130,246,${0.3 - i * 0.05})`,
                color: "#93c5fd",
              }}
            >
              {t.name} {t.count}
            </span>
          ))}
        </div>
      </div>

      {/* 최고 난이도 */}
      <p className="text-xs text-gray-600">
        푼 문제 최고 난이도:{" "}
        <span className="text-yellow-400 font-semibold">
          {TIER_LABEL[data.hardestLevel] ?? data.hardestLevel}
        </span>
      </p>
    </div>
  );
}
