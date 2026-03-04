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
        const isDone = c.decoration === "gold" || c.decoration === "silver";

        return (
          <div key={c.class}>
            <div className="flex justify-between text-sm mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">CLASS {c.class}</span>
                {isDone && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0046FE] font-medium">
                    완료
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-xs">
                {c.totalSolved}/{c.total}
                <span className="text-gray-300 ml-1">({c.pct}%)</span>
              </span>
            </div>
            <div className="h-2 bg-blue-50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${c.pct}%`,
                  backgroundColor: isDone ? "#2E67FE" : "#0046FE",
                  opacity: isDone ? 0.5 : 1,
                }}
              />
            </div>
            {!isDone && c.totalSolved > 0 && (
              <p className="text-right text-xs text-gray-300 mt-0.5">
                에센셜 {c.essentialSolved}/{c.essentials}
              </p>
            )}
          </div>
        );
      })}

      {nextClassInfo && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
          <p className="text-[#0046FE] font-semibold">
            CLASS {nextClassInfo.class} 달성까지
          </p>
          <p className="text-[#2E67FE] mt-0.5">
            에센셜 <span className="font-bold text-[#0046FE]">{nextClassInfo.essentialLeft}문제</span> 남음
            <span className="text-gray-400 ml-2">(전체 {nextClassInfo.totalLeft}문제)</span>
          </p>
        </div>
      )}
    </div>
  );
}
