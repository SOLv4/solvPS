import { BookOpenCheck, Flag, Map } from "lucide-react";

interface Step {
  id: number;
  order: number;
  title: string;
  description: string | null;
}

interface Roadmap {
  id: number;
  title: string;
  description: string | null;
  steps: Step[];
}

export default function RoadmapSection({ roadmaps }: { roadmaps: Roadmap[] }) {
  if (roadmaps.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Map size={14} className="text-[#0F46D8]" />
            <h2 className="text-sm font-semibold text-gray-800">로드맵</h2>
          </div>
        </div>
        <div className="p-5">
          <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            아직 로드맵이 없습니다.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Map size={14} className="text-[#0F46D8]" />
          <h2 className="text-sm font-semibold text-gray-800">로드맵</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
          {roadmaps.length}개 트랙
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {roadmaps.map((roadmap, index) => {
          const stepCount = roadmap.steps.length;
          const visibleSteps = roadmap.steps.slice(0, 5);
          const coverage = Math.min(100, Math.max(8, stepCount * 16));

          return (
            <div key={roadmap.id} className="px-5 py-4">
              {/* 트랙 헤더 */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-[#0F46D8] uppercase">
                    TRACK {index + 1}
                  </p>
                  <h3 className="mt-0.5 text-sm font-bold text-gray-800">{roadmap.title}</h3>
                  {roadmap.description && (
                    <p className="mt-0.5 text-xs text-gray-400">{roadmap.description}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-500">
                  <BookOpenCheck size={11} />
                  {stepCount}단계
                </span>
              </div>

              {/* 진행 바 */}
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#0F46D8]"
                  style={{ width: `${coverage}%` }}
                />
              </div>

              {/* 스텝 목록 */}
              <ol className="space-y-1.5">
                {visibleSteps.map((step, stepIndex) => (
                  <li
                    key={step.id}
                    className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#EEF4FF] text-[10px] font-bold text-[#0F46D8]">
                      {step.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">{step.title}</p>
                      {step.description && (
                        <p className="mt-0.5 text-[11px] text-gray-400">{step.description}</p>
                      )}
                    </div>
                    {stepIndex === 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[#EEF4FF] text-[#0F46D8]">
                        <Flag size={9} />
                        START
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              {stepCount > visibleSteps.length && (
                <p className="mt-2 text-right text-xs text-gray-400">
                  +{stepCount - visibleSteps.length}개 단계 더 있음
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
