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

const BARS = [
  { key: "easy",     label: "쉬움",      color: "#7DA3FE" },
  { key: "normal",   label: "보통",      color: "#2E67FE" },
  { key: "hard",     label: "어려움",    color: "#0046FE" },
  { key: "veryHard", label: "매우 어려움", color: "#003ACC" },
] as const;

export default function StyleCard({ data }: { data: StyleData }) {
  const total = data.easy + data.normal + data.hard + data.veryHard;

  return (
    <div className="space-y-5">
      {/* 스타일 레이블 */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{data.styleLabel.split(" ")[1]}</span>
        <div>
          <p className="font-semibold text-gray-800">{data.styleLabel.split(" ")[0]}</p>
          <p className="text-xs text-gray-400">top 100 문제 기준 분석</p>
        </div>
      </div>

      {/* 난이도 분포 바 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">문제 난이도 분포 (타인 평균 시도 횟수 기준)</p>
        <div className="flex h-5 rounded-lg overflow-hidden gap-px">
          {BARS.map((b) =>
            data[b.key] > 0 ? (
              <div
                key={b.label}
                className="h-full transition-all"
                style={{ width: `${(data[b.key] / total) * 100}%`, backgroundColor: b.color }}
                title={`${b.label}: ${data[b.key]}개`}
              />
            ) : null
          )}
        </div>
        <div className="flex gap-4 mt-2 flex-wrap">
          {BARS.map((b) => (
            <div key={b.label} className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
              {b.label} {data[b.key]}개
            </div>
          ))}
        </div>
      </div>

      {/* 주력 태그 */}
      <div>
        <p className="text-xs text-gray-400 mb-2">top 100 주력 알고리즘</p>
        <div className="flex flex-wrap gap-2">
          {data.topTags.map((t, i) => (
            <span
              key={t.name}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `rgba(0,70,254,${0.08 + i * 0.02})`,
                color: "#0046FE",
                border: "1px solid rgba(0,70,254,0.15)",
              }}
            >
              {t.name} {t.count}
            </span>
          ))}
        </div>
      </div>

      {/* 최고 난이도 */}
      <p className="text-xs text-gray-400">
        푼 문제 최고 난이도:{" "}
        <span className="font-semibold text-[#0046FE]">
          {TIER_LABEL[data.hardestLevel] ?? data.hardestLevel}
        </span>
      </p>
    </div>
  );
}
