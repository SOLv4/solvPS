"use client";

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
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-b from-white to-[#f8faff] p-6 shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
        <div className="mb-4 flex items-center gap-2">
          <Map size={18} className="text-[#0F46D8]" />
          <h2 className="text-base font-semibold text-slate-800">로드맵</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">
          아직 로드맵이 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-6 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map size={18} className="text-[#0F46D8]" />
          <h2 className="text-base font-semibold text-slate-800">로드맵</h2>
        </div>
        <p className="text-xs text-slate-500">총 {roadmaps.length}개 트랙</p>
      </div>

      <div className="space-y-4">
        {roadmaps.map((roadmap, index) => {
          const stepCount = roadmap.steps.length;
          const completedCount = roadmap.steps.filter((s) => progress[s.id]).length;
          const completionPct = stepCount === 0 ? 0 : Math.round((completedCount / stepCount) * 100);
          const visibleSteps = roadmap.steps.slice(0, 5);

          return (
            <div
              key={roadmap.id}
              className="rounded-2xl border border-blue-100 bg-white/75 p-4 backdrop-blur-md shadow-[0_20px_50px_-42px_rgba(0,70,254,0.55)]"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-600">TRACK {index + 1}</p>
                  <h3 className="mt-0.5 text-base font-semibold text-slate-800">{roadmap.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{roadmap.description || "설명 없음"}</p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-[#F2F7FF] px-2.5 py-1 font-medium text-blue-700">
                    <BookOpenCheck size={12} />
                    {stepCount}단계
                  </span>
                  {stepCount > 0 && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${
                        completionPct === 100
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-blue-200 bg-[#F2F7FF] text-blue-700"
                      }`}
                    >
                      {completedCount}/{stepCount} 완료
                    </span>
                  )}
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mb-1 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionPct === 100
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-[#0F46D8] to-[#6B92FF]"
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="mb-3 text-right text-[11px] text-slate-400">{completionPct}%</p>

              <ol className="space-y-2">
                {visibleSteps.map((step, stepIndex) => {
                  const done = !!progress[step.id];
                  return (
                    <li
                      key={step.id}
                      className={`relative flex items-start gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-sm transition-colors ${
                        done
                          ? "border-green-200 bg-green-50/60"
                          : "border-blue-100 bg-white/80"
                      }`}
                    >
                      <button
                        onClick={() => onToggle(step.id, !done)}
                        className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                        aria-label={done ? "완료 취소" : "완료 표시"}
                      >
                        {done ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <Circle size={18} className="text-slate-300" />
                        )}
                      </button>
                      {stepIndex < visibleSteps.length - 1 && (
                        <span className="absolute left-[22px] top-9 h-4 w-px bg-blue-200/80" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                          {step.title}
                        </p>
                        {step.description && (
                          <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                        )}
                      </div>
                      {stepIndex === 0 && !done && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          <Flag size={10} />
                          START
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>

              {stepCount > visibleSteps.length && (
                <p className="mt-2 text-right text-xs text-slate-500">
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
