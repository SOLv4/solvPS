import { Map } from "lucide-react";

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
  return (
    <div className="border border-[#EAEAEA] rounded-2xl p-6 mt-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 mb-4">
        <Map size={18} className="text-[#0046FE]" />
        <h2 className="text-base font-semibold text-[#111]">로드맵</h2>
      </div>

      {roadmaps.length === 0 ? (
        <p className="text-[#999] text-sm py-4 text-center">아직 로드맵이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((roadmap) => (
            <div key={roadmap.id} className="border border-[#EAEAEA] rounded-xl p-4 bg-[#F5F8FF]">
              <h3 className="font-semibold text-[#111] mb-1">{roadmap.title}</h3>
              {roadmap.description && (
                <p className="text-xs text-[#666] mb-3">{roadmap.description}</p>
              )}
              <ol className="space-y-1.5">
                {roadmap.steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-2 text-sm text-[#444]">
                    <span className="text-[#0046FE] font-medium shrink-0">{step.order}.</span>
                    <span>{step.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
