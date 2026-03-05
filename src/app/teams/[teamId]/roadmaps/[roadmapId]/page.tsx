"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Layers3, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RoadmapMeta = {
  id: number;
  title: string;
  description: string | null;
};

type RoadmapProblem = {
  problemId: number;
  bojId: number;
  title: string;
  level: number;
};

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

  const [roadmap, setRoadmap] = useState<RoadmapMeta | null>(null);
  const [problems, setProblems] = useState<RoadmapProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [groupRes, problemsRes] = await Promise.all([
          fetch(`/api/group/${teamId}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(
            `/api/group/${teamId}/roadmap-problems?roadmapId=${roadmapId}`,
            {
              cache: "no-store",
              signal: controller.signal,
            },
          ),
        ]);

        if (!groupRes.ok) throw new Error("로드맵 정보를 불러오지 못했습니다.");
        if (!problemsRes.ok)
          throw new Error("로드맵 문제를 불러오지 못했습니다.");

        const groupData = (await groupRes.json()) as {
          roadmaps?: Array<{
            id: number;
            title: string;
            description: string | null;
          }>;
        };
        const problemData = (await problemsRes.json()) as {
          items?: RoadmapProblem[];
        };

        const foundRoadmap = (groupData.roadmaps ?? []).find(
          (item) => String(item.id) === String(roadmapId),
        );

        setRoadmap(foundRoadmap ?? null);
        setProblems(problemData.items ?? []);
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : "로드맵 페이지 로딩 실패");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [teamId, roadmapId]);

  const summary = useMemo(() => {
    const hardest = Math.max(...problems.map((problem) => problem.level), 0);
    return {
      count: problems.length,
      hardest,
    };
  }, [problems]);

  async function handleDeleteProblem(problem: RoadmapProblem) {
    try {
      const res = await fetch(`/api/group/${teamId}/roadmap-problems`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bojId: problem.bojId,
          roadmapId: Number(roadmapId),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "문제 삭제 실패");
      }

      setProblems((prev) =>
        prev.filter((item) => item.problemId !== problem.problemId),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제 삭제 실패");
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-slate-500">로드맵을 불러오는 중...</div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">
              로드맵을 찾을 수 없습니다.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              목록으로 돌아가서 다시 선택해 주세요.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 rounded-xl border-blue-200 text-[#0F46D8]"
            >
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
                <p className="text-xs font-semibold tracking-wider text-blue-700">
                  TRACK DETAIL
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
                  {roadmap.title}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {roadmap.description || "설명 없음"}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-2xl border-blue-200 bg-white/85 text-[#0F46D8] hover:bg-[#F4F8FF]"
              >
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
                <p className="text-xs text-slate-500">문제 출처</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Tag size={16} />
                  BOJ
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
                <p className="text-xs text-slate-500">최고 난이도</p>
                <p className="mt-1 text-xl font-bold text-[#0F46D8]">
                  {summary.hardest || "-"}
                </p>
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
              <article
                key={problem.problemId}
                className="rounded-3xl border border-blue-100/90 bg-gradient-to-b from-white/80 to-[#f8faff]/85 p-4 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-44px_rgba(0,70,254,0.65)]"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {problem.bojId}. {problem.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      난이도 구간: {levelLabel(problem.level)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="border border-blue-200 bg-[#F2F7FF] text-[#0F46D8]">
                      Lv {problem.level}
                    </Badge>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-blue-200 text-[#0F46D8] hover:bg-[#F4F8FF]"
                    >
                      <a
                        href={`https://www.acmicpc.net/problem/${problem.bojId}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        문제 보기
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteProblem(problem)}
                    >
                      <Trash2 className="size-4" />
                      삭제
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
