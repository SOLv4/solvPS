import { BookOpenCheck, CheckCircle2, Circle, Flag, Map } from "lucide-react";

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

interface Props {
  roadmaps: Roadmap[];
  progress: Record<number, boolean>;
  onToggle: (stepId: number, completed: boolean) => void;
}

export default function RoadmapSection({ roadmaps, progress, onToggle }: Props) {
  if (roadmaps.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF4FF]">
              <Map size={13} className="text-[#0F46D8]" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">로드맵</h2>
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
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF4FF]">
            <Map size={13} className="text-[#0F46D8]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">로드맵</h2>
            <p className="text-xs text-gray-400">학습 트랙 및 단계별 진행 현황</p>
          </div>
        </div>
        <span className="rounded-full border border-gray-200 bg-[#F9FAFB] px-3 py-1 text-xs font-bold text-gray-500">
          {roadmaps.length}개 트랙
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {roadmaps.map((roadmap, index) => {
          const stepCount = roadmap.steps.length;
          const completedCount = roadmap.steps.filter((s) => progress[s.id]).length;
          const completionPct = stepCount === 0 ? 0 : Math.round((completedCount / stepCount) * 100);
          const visibleSteps = roadmap.steps.slice(0, 5);
          const coverage = stepCount === 0 ? 0 : Math.max(8, completionPct);

          return (
            <div key={roadmap.id} className="px-5 py-4">
              {/* 트랙 헤더 */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs font-bold tracking-widest text-[#0F46D8] uppercase">
                    TRACK {index + 1}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-gray-800">{roadmap.title}</h3>
                  {roadmap.description && (
                    <p className="mt-0.5 text-xs text-gray-400">{roadmap.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500">
                    <BookOpenCheck size={11} />
                    {stepCount}단계
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${
                      completionPct === 100
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-blue-200 bg-[#EEF4FF] text-[#0F46D8]"
                    }`}
                  >
                    {completedCount}/{stepCount} 완료
                  </span>
                </div>
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
                {visibleSteps.map((step, stepIndex) => {
                  const done = !!progress[step.id];
                  return (
                  <li
                    key={step.id}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                      done
                        ? "border-green-200 bg-green-50/60"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => onToggle(step.id, !done)}
                      className="mt-0.5 shrink-0"
                      aria-label={done ? "완료 취소" : "완료 표시"}
                    >
                      {done ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : (
                        <Circle size={18} className="text-slate-300" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? "text-slate-400 line-through" : "text-gray-700"}`}>
                        {step.title}
                      </p>
                      {step.description && (
                        <p className="mt-0.5 text-xs text-gray-400">{step.description}</p>
                      )}
                    </div>
                    {stepIndex === 0 && !done && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold bg-[#EEF4FF] text-[#0F46D8]">
                        <Flag size={9} />
                        START
                      </span>
                    )}
                  </li>
                )})}
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
