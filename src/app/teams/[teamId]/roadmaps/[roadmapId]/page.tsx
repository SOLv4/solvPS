"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Layers3, Tag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockProblemsByRoadmapId, getMockRoadmapById, type Problem } from "@/lib/mock";

const levelLabel = (level: number) => {
  if (level <= 5) return "Bronze";
  if (level <= 10) return "Silver";
  if (level <= 15) return "Gold";
  return "High";
};

export default function RoadmapDetailPage() {
  const params = useParams<{ teamId: string; roadmapId: string }>();
  const teamId = params?.teamId ?? "1";
  const roadmapId = params?.roadmapId ?? "";
  const roadmap = getMockRoadmapById(roadmapId);
  const [problems, setProblems] = useState<Problem[]>(() => getMockProblemsByRoadmapId(roadmapId));

  const summary = useMemo(() => {
    const tagCount = new Set(problems.flatMap((problem) => problem.tags)).size;
    const hardest = Math.max(...problems.map((problem) => problem.level), 0);
    return {
      count: problems.length,
      tagCount,
      hardest,
    };
  }, [problems]);

  function handleDeleteProblem(problemId: string) {
    setProblems((prev) => prev.filter((problem) => problem.id !== problemId));
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">로드맵을 찾을 수 없습니다.</p>
            <p className="mt-1 text-sm text-slate-500">목록으로 돌아가서 다시 선택해 주세요.</p>
            <Button asChild variant="outline" className="mt-4 rounded-xl border-blue-200 text-[#0F46D8]">
              <Link href={`/teams/${teamId}/roadmaps`}>목록으로</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">트랙 상세</p>
              <h1 className="text-2xl font-bold text-gray-900">{roadmap.title}</h1>
              <p className="mt-1 text-sm text-gray-400">{roadmap.description || "설명 없음"}</p>
            </div>
            <Button asChild variant="outline" className="rounded-lg border-gray-200 text-[#0F46D8] hover:bg-gray-50">
              <Link href={`/teams/${teamId}/roadmaps`}>
                <ArrowLeft className="size-4" />
                목록으로
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Layers3 size={14} />, label: "담긴 문제", value: summary.count },
              { icon: <Tag size={14} />, label: "태그 다양성", value: summary.tagCount },
              { icon: null, label: "최고 난이도", value: summary.hardest || "-" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="rounded-xl border border-gray-100 p-3.5">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">{icon}{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        {problems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            아직 담긴 문제가 없습니다.
          </div>
        ) : (
          problems.map((problem) => (
            <article key={problem.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-gray-200">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {problem.bojId}. {problem.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">난이도 구간: {levelLabel(problem.level)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border border-blue-100 bg-[#EEF4FF] text-[#0F46D8]">Lv {problem.level}</Badge>
                  <Button asChild size="sm" variant="outline" className="rounded-lg border-gray-200 text-[#0F46D8] hover:bg-gray-50">
                    <a href={`https://www.acmicpc.net/problem/${problem.bojId}`} target="_blank" rel="noreferrer noopener">
                      문제 보기
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteProblem(problem.id)}>
                    <Trash2 className="size-4" />
                    삭제
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {problem.tags.map((tag) => (
                  <Badge key={tag} className="border border-gray-200 bg-white text-gray-600">
                    {tag}
                  </Badge>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
      </div>
    </div>
  );
}
