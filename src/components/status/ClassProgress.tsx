"use client";

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

const DECORATION_STYLE: Record<string, { label: string; color: string }> = {
  gold:   { label: "🥇 완료", color: "#ec9a00" },
  silver: { label: "🥈 실버", color: "#435f7a" },
  none:   { label: "진행 중", color: "#3b82f6" },
};

export default function ClassProgress({
  data,
  nextClassInfo,
}: {
  data: ClassStat[];
  nextClassInfo: NextClassInfo | null;
}) {
  return (
    <div className="space-y-3">
      {data.map((c) => {
        const deco = c.decoration ? DECORATION_STYLE[c.decoration] ?? DECORATION_STYLE.none : null;
        const isDone = c.decoration === "gold" || c.decoration === "silver";

        return (
          <div key={c.class}>
            <div className="flex justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-medium">CLASS {c.class}</span>
                {deco && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: deco.color, backgroundColor: `${deco.color}22` }}>
                    {deco.label}
                  </span>
                )}
              </div>
              <span className="text-gray-500">
                {c.totalSolved}/{c.total}
                <span className="text-gray-700 ml-1">({c.pct}%)</span>
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${c.pct}%`,
                  backgroundColor: isDone ? "#ec9a00" : "#3b82f6",
                  opacity: isDone ? 0.7 : 1,
                }}
              />
            </div>
            {!isDone && c.totalSolved > 0 && (
              <p className="text-xs text-gray-600 mt-0.5 text-right">
                에센셜 {c.essentialSolved}/{c.essentials}
              </p>
            )}
          </div>
        );
      })}

      {nextClassInfo && (
        <div className="mt-4 p-3 bg-blue-950 border border-blue-800 rounded-lg text-sm">
          <p className="text-blue-300 font-medium">
            🎯 CLASS {nextClassInfo.class} 달성까지
          </p>
          <p className="text-blue-400 mt-0.5">
            에센셜 <span className="font-bold text-white">{nextClassInfo.essentialLeft}문제</span> 남음
            <span className="text-blue-700 ml-2">(전체 {nextClassInfo.totalLeft}문제)</span>
          </p>
        </div>
      )}
    </div>
  );
}
