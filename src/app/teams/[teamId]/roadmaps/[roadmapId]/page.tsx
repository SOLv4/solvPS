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
      <div className="relative min-h-screen overflow-hidden bg-[#f7faff]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(15,70,216,0.14),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(82,126,255,0.15),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(15,70,216,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,70,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-white to-[#f8faff] p-6 text-center shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
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
    <div className="relative min-h-screen overflow-hidden bg-[#f7faff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(15,70,216,0.14),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(82,126,255,0.15),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(15,70,216,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,70,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <section className="relative overflow-hidden rounded-3xl border border-blue-200 bg-[radial-gradient(circle_at_0%_0%,#ffffff_0%,#f6f9ff_45%,#eff4ff_100%)] p-6 shadow-[0_30px_80px_-52px_rgba(0,70,254,0.65)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-blue-700">TRACK DETAIL</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">{roadmap.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{roadmap.description || "설명 없음"}</p>
            </div>
            <Button asChild variant="outline" className="rounded-2xl border-blue-200 bg-white/85 text-[#0F46D8] hover:bg-[#F4F8FF]">
              <Link href={`/teams/${teamId}/roadmaps`}>
                <ArrowLeft className="size-4" />
                목록으로
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">담긴 문제</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Layers3 size={16} />
                {summary.count}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">태그 다양성</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Tag size={16} />
                {summary.tagCount}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">최고 난이도</p>
              <p className="mt-1 text-xl font-bold text-[#0F46D8]">{summary.hardest || "-"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {problems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">
            아직 담긴 문제가 없습니다.
          </div>
        ) : (
          problems.map((problem) => (
            <article key={problem.id} className="rounded-3xl border border-blue-100/90 bg-gradient-to-b from-white/80 to-[#f8faff]/85 p-4 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-44px_rgba(0,70,254,0.65)]">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {problem.bojId}. {problem.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">난이도 구간: {levelLabel(problem.level)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="border border-blue-200 bg-[#F2F7FF] text-[#0F46D8]">Lv {problem.level}</Badge>
                  <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteProblem(problem.id)}>
                    <Trash2 className="size-4" />
                    삭제
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {problem.tags.map((tag) => (
                  <Badge key={tag} className="border border-blue-200 bg-white text-slate-600">
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
