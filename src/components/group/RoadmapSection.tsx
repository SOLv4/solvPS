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
          const visibleSteps = roadmap.steps.slice(0, 5);
          const coverage = Math.min(100, Math.max(15, stepCount * 16));

          return (
            <div key={roadmap.id} className="rounded-2xl border border-blue-100 bg-white/75 p-4 backdrop-blur-md shadow-[0_20px_50px_-42px_rgba(0,70,254,0.55)]">
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
                </div>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0F46D8] to-[#6B92FF]"
                  style={{ width: `${coverage}%` }}
                />
              </div>

              <ol className="space-y-2">
                {visibleSteps.map((step, stepIndex) => (
                  <li key={step.id} className="relative flex items-start gap-2.5 rounded-xl border border-blue-100 bg-white/80 px-3 py-2.5 backdrop-blur-sm">
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#E8F0FF] text-[11px] font-bold text-[#0F46D8]">
                      {step.order}
                    </span>
                    {stepIndex < visibleSteps.length - 1 && (
                      <span className="absolute left-[22px] top-8 h-5 w-px bg-blue-200/80" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">{step.title}</p>
                      {step.description && <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>}
                    </div>
                    {stepIndex === 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        <Flag size={10} />
                        START
                      </span>
                    )}
                  </li>
                ))}
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
