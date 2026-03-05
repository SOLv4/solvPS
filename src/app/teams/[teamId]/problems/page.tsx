"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Filter, Layers3, Search, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tierPresetOptions, type TierPreset } from "@/lib/mock";

type Problem = {
  id: string;
  bojId: number;
  title: string;
  level: number;
  tags: string[];
};

type TeamRoadmap = {
  id: number;
  title: string;
  description: string | null;
  problemsCount: number;
};

const tierBand = (level: number) => {
  if (level <= 5) return "브론즈";
  if (level <= 10) return "실버";
  if (level <= 15) return "골드";
  return "상위 티어";
};

export default function TeamProblemsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId ?? "1";

  const [problems, setProblems] = useState<Problem[]>([]);
  const [roadmaps, setRoadmaps] = useState<TeamRoadmap[]>([]);
  const [problemRoadmapMap, setProblemRoadmapMap] = useState<
    Record<string, number[]>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [q, setQ] = useState("");
  const [tierPreset, setTierPreset] = useState<TierPreset>("all");
  const [tagQuery, setTagQuery] = useState("");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProblemBojId, setSelectedProblemBojId] = useState<
    number | null
  >(null);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const loadRoadmapState = async () => {
      try {
        const [groupRes, mapRes] = await Promise.all([
          fetch(`/api/group/${teamId}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`/api/group/${teamId}/roadmap-problems`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (groupRes.ok) {
          const groupData = (await groupRes.json()) as {
            roadmaps?: Array<{
              id: number;
              title: string;
              description: string | null;
              problemsCount?: number;
            }>;
          };
          setRoadmaps(
            (groupData.roadmaps ?? []).map((roadmap) => ({
              id: roadmap.id,
              title: roadmap.title,
              description: roadmap.description,
              problemsCount: roadmap.problemsCount ?? 0,
            })),
          );
        }

        if (mapRes.ok) {
          const mapData = (await mapRes.json()) as Record<string, number[]>;
          setProblemRoadmapMap(mapData);
        }
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setActionError("로드맵 상태를 불러오지 못했습니다.");
        }
      }
    };

    void loadRoadmapState();

    return () => controller.abort();
  }, [teamId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          q,
          tier: tierPreset,
          tag: tagQuery,
          page: "1",
          size: "30",
        });
        const res = await fetch(`/api/problems/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`request failed: ${res.status}`);
        const data = (await res.json()) as { items?: Problem[] };
        if (Array.isArray(data.items)) setProblems(data.items);
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") return;
        setLoadError("solved.ac 검색 결과를 불러오지 못했습니다.");
        setProblems([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, tierPreset, tagQuery]);

  const summary = useMemo(() => {
    const mapped = problems.map((problem) => ({
      ...problem,
      inRoadmap: (problemRoadmapMap[String(problem.bojId)] ?? []).length > 0,
    }));
    const inRoadmapCount = mapped.filter((problem) => problem.inRoadmap).length;
    const avgLevel =
      mapped.length > 0
        ? Math.round(
            (mapped.reduce((sum, p) => sum + p.level, 0) / mapped.length) * 10,
          ) / 10
        : 0;
    const tags = mapped.flatMap((problem) => problem.tags);
    const topTag = Object.entries(
      tags.reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      total: mapped.length,
      inRoadmapCount,
      avgLevel,
      topTag: topTag ? `${topTag[0]} (${topTag[1]})` : "-",
    };
  }, [problems, problemRoadmapMap]);

  function handleOpenAddDialog(problemBojId: number) {
    setSelectedProblemBojId(problemBojId);
    const alreadySelected = problemRoadmapMap[String(problemBojId)] ?? [];
    const firstAvailableRoadmapId =
      roadmaps.find((roadmap) => !alreadySelected.includes(roadmap.id))?.id ??
      "";
    setSelectedRoadmapId(String(firstAvailableRoadmapId));
    setAddDialogOpen(true);
    setActionError("");
  }

  async function handleAddToRoadmap() {
    if (!selectedProblemBojId || !selectedRoadmapId) return;

    const selectedProblem = problems.find(
      (problem) => problem.bojId === selectedProblemBojId,
    );
    if (!selectedProblem) return;

    setActionError("");
    try {
      const res = await fetch(`/api/group/${teamId}/roadmap-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bojId: selectedProblem.bojId,
          title: selectedProblem.title,
          level: selectedProblem.level,
          roadmapId: Number(selectedRoadmapId),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "로드맵 담기 실패");
      }

      setProblemRoadmapMap((prev) => {
        const key = String(selectedProblemBojId);
        const prevIds = prev[key] ?? [];
        const targetRoadmapId = Number(selectedRoadmapId);
        if (prevIds.includes(targetRoadmapId)) return prev;
        return { ...prev, [key]: [...prevIds, targetRoadmapId] };
      });

      setAddDialogOpen(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "로드맵 담기 실패",
      );
    }
  }

  async function handleRemoveFromRoadmap(problemBojId: number) {
    const roadmapIds = problemRoadmapMap[String(problemBojId)] ?? [];
    if (roadmapIds.length === 0) return;

    setActionError("");
    try {
      await Promise.all(
        roadmapIds.map(async (roadmapId) => {
          const res = await fetch(`/api/group/${teamId}/roadmap-problems`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bojId: problemBojId, roadmapId }),
          });
          if (!res.ok) throw new Error("로드맵 제거 실패");
        }),
      );

      setProblemRoadmapMap((prev) => {
        const next = { ...prev };
        delete next[String(problemBojId)];
        return next;
      });
    } catch {
      setActionError("문제를 로드맵에서 제거하지 못했습니다.");
    }
  }

  const selectedProblemRoadmapIds = selectedProblemBojId
    ? (problemRoadmapMap[String(selectedProblemBojId)] ?? [])
    : [];
  const availableRoadmaps = roadmaps.filter(
    (roadmap) => !selectedProblemRoadmapIds.includes(roadmap.id),
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-gray-400">문제 검색</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                문제 검색
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                난이도/태그 기준으로 문제를 필터링하고 바로 로드맵에 편입하세요.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-100 p-3.5">
                <p className="text-xs text-gray-400">검색 결과</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Search size={16} />
                  {summary.total}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3.5">
                <p className="text-xs text-gray-400">로드맵 편입</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Layers3 size={16} />
                  {summary.inRoadmapCount}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3.5">
                <p className="text-xs text-gray-400">평균 난이도</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Target size={16} />
                  {summary.avgLevel || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3.5">
                <p className="text-xs text-gray-400">주요 태그</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Sparkles size={16} />
                  <span className="truncate">{summary.topTag}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={17} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">필터</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="문제명 또는 BOJ 번호 검색"
                className="rounded-xl border-gray-200 bg-white pl-9"
              />
            </div>
            <Select
              value={tierPreset}
              onValueChange={(value) => setTierPreset(value as TierPreset)}
            >
              <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                <SelectValue placeholder="난이도 선택" />
              </SelectTrigger>
              <SelectContent>
                {tierPresetOptions.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    난이도 {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={tagQuery}
              onChange={(event) => setTagQuery(event.target.value)}
              placeholder="태그 필터 (예: 그래프, DP)"
              className="rounded-xl border-gray-200 bg-white"
            />
          </div>
        </section>

        <section className="space-y-3">
          {loadError ? (
            <p className="text-sm text-red-500">{loadError}</p>
          ) : null}
          {actionError ? (
            <p className="text-sm text-red-500">{actionError}</p>
          ) : null}
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              검색 결과를 불러오는 중...
            </div>
          ) : null}
          {!isLoading && problems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
              검색 결과가 없습니다.
            </div>
          ) : null}

          {!isLoading &&
            problems.map((problem) => {
              const roadmapIds = problemRoadmapMap[String(problem.bojId)] ?? [];
              const inRoadmap = roadmapIds.length > 0;
              return (
                <article
                  key={problem.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-gray-200"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {problem.bojId}. {problem.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        난이도 대역: {tierBand(problem.level)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="border border-blue-200 bg-[#F2F7FF] text-[#0F46D8]">
                        Lv {problem.level}
                      </Badge>
                      <Badge
                        className={
                          inRoadmap
                            ? "border border-blue-200 bg-[#0F46D8] text-white"
                            : "border border-slate-200 bg-white text-slate-600"
                        }
                      >
                        {inRoadmap
                          ? `로드맵 편입 (${roadmapIds.length})`
                          : "미편입"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="border border-gray-200 bg-white text-gray-600"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      asChild
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
                      className="rounded-xl bg-[#0F46D8] text-white hover:bg-[#0A37B0]"
                      onClick={() => handleOpenAddDialog(problem.bojId)}
                    >
                      로드맵에 담기
                    </Button>
                    {inRoadmap ? (
                      <Button
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() =>
                          void handleRemoveFromRoadmap(problem.bojId)
                        }
                      >
                        모두 빼기
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
        </section>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>로드맵에 담기</DialogTitle>
              <DialogDescription>담을 로드맵을 선택하세요.</DialogDescription>
            </DialogHeader>
            <Select
              value={selectedRoadmapId}
              onValueChange={setSelectedRoadmapId}
            >
              <SelectTrigger className="w-full rounded-xl border-blue-200">
                <SelectValue placeholder="로드맵 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableRoadmaps.map((roadmap) => (
                  <SelectItem key={roadmap.id} value={String(roadmap.id)}>
                    {roadmap.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableRoadmaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                이미 모든 로드맵에 담긴 문제입니다.
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={() => void handleAddToRoadmap()}
                disabled={!selectedRoadmapId || availableRoadmaps.length === 0}
                className="bg-[#0F46D8] text-white hover:bg-[#0A37B0]"
              >
                담기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
