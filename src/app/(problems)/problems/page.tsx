"use client";

import { useEffect, useMemo, useState } from "react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getMockProblems,
  getMockRoadmaps,
  tagPresetOptions,
  tierPresetOptions,
  type Problem,
  type TagPreset,
  type TierPreset,
} from "@/lib/mock";

const PAGE_SIZE = 20;

const TIER_NAMES = [
  "Unrated",
  "브론즈",
  "실버",
  "골드",
  "플래티넘",
  "다이아몬드",
  "루비",
];
const GRADE_LABELS = ["", "V", "IV", "III", "II", "I"];

const tierLabel = (level: number) => {
  if (level === 0) return "Unrated";
  const tier = Math.ceil(level / 5); // 1=브론즈 ~ 6=루비
  const grade = 5 - ((level - 1) % 5); // V=1, IV=2, III=3, II=4, I=5
  return `${TIER_NAMES[tier]} ${GRADE_LABELS[grade]}`;
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  const [q, setQ] = useState("");
  const [tierPreset, setTierPreset] = useState<TierPreset>("all");
  const [tagPreset, setTagPreset] = useState<TagPreset>("all");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>("");

  const [problemRoadmapMap, setProblemRoadmapMap] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const controller = new AbortController();
    async function init() {
      try {
        const groupsRes = await fetch("/api/group", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (groupsRes.ok) {
          const groups = (await groupsRes.json()) as Group[];
          setGroupId(groups[0]?.id ?? null);
        }
      } catch {
        // 초기 로딩 실패 시 검색 기능은 유지
      }
    }
    void init();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    const controller = new AbortController();

    async function loadRoadmapsAndMappedProblems() {
      try {
        const [roadmapsRes, mapRes] = await Promise.all([
          fetch("/api/roadmaps", { cache: "no-store", signal: controller.signal }),
          fetch(`/api/group/${groupId}/roadmap-problems`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (roadmapsRes.ok) {
          const roadmapsData = (await roadmapsRes.json()) as {
            items?: Array<{ id: number; title: string }>;
          };
          setRoadmaps((roadmapsData.items ?? []).map((item) => ({ id: item.id, title: item.title })));
        } else {
          setRoadmaps([]);
        }

        if (!mapRes.ok) return;
        const data = (await mapRes.json()) as Record<string, number[] | number>;
        const normalized: Record<string, number[]> = {};
        Object.entries(data).forEach(([bojId, ids]) => {
          normalized[bojId] = Array.isArray(ids) ? ids : [ids];
        });
        setProblemRoadmapMap(normalized);
      } catch {
        // 무시
      }
    }

    void loadRoadmapsAndMappedProblems();
    return () => controller.abort();
  }, [groupId]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          q,
          tier: tierPreset,
          tag: tagPreset === "all" ? "" : tagPreset,
          page: String(currentPage),
          size: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/problems/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`request failed: ${res.status}`);
        const data = (await res.json()) as {
          items?: Problem[];
          count?: number;
        };
        if (Array.isArray(data.items)) {
          setProblems(data.items);
          setIsLastPage(data.items.length < PAGE_SIZE);
        }
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
  }, [q, tierPreset, tagPreset, currentPage]);

  const summary = useMemo(() => {
    const inRoadmapCount = problems.filter((problem) => {
      const ids = problemRoadmapMap[String(problem.bojId)] ?? [];
      return ids.length > 0;
    }).length;
    const avgLevel =
      problems.length > 0
        ? Math.round((problems.reduce((sum, p) => sum + p.level, 0) / problems.length) * 10) / 10
        : 0;
    const tags = problems.flatMap((problem) => problem.tags);
    const topTag = Object.entries(
      tags.reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      total: problems.length,
      inRoadmapCount,
      avgLevel,
      topTag: topTag ? `${topTag[0]} (${topTag[1]})` : "-",
    };
  }, [problems, problemRoadmapMap]);

  function handleOpenAddDialog(problemId: string) {
    setSelectedProblemId(problemId);
    const problem = problems.find((item) => item.id === problemId);
    const selected = problem ? (problemRoadmapMap[String(problem.bojId)] ?? []) : [];
    const firstAvailable = roadmaps.find((roadmap) => !selected.includes(roadmap.id));
    setSelectedRoadmapId(firstAvailable ? String(firstAvailable.id) : "");
    setActionError("");
    setAddDialogOpen(true);
  }

  async function handleAddToRoadmap() {
    if (!groupId || !selectedProblemId || !selectedRoadmapId) return;

    const problem = problems.find((item) => item.id === selectedProblemId);
    if (!problem) return;

    try {
      const res = await fetch(`/api/group/${groupId}/roadmap-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bojId: problem.bojId,
          title: problem.title,
          level: problem.level,
          roadmapId: Number(selectedRoadmapId),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "로드맵 추가 실패");
      }

      setProblemRoadmapMap((prev) => {
        const key = String(problem.bojId);
        const prevIds = prev[key] ?? [];
        if (prevIds.includes(Number(selectedRoadmapId))) return prev;
        return { ...prev, [key]: [...prevIds, Number(selectedRoadmapId)] };
      });
      setAddDialogOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "로드맵 추가 실패");
    }
  }

  async function handleRemoveFromRoadmap(problem: Problem) {
    const roadmapIds = problemRoadmapMap[String(problem.bojId)] ?? [];
    if (!groupId || roadmapIds.length === 0) return;

    setActionError("");
    try {
      await Promise.all(
        roadmapIds.map(async (roadmapId) => {
          const res = await fetch(`/api/group/${groupId}/roadmap-problems`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bojId: problem.bojId, roadmapId }),
          });
          if (!res.ok) throw new Error("삭제 실패");
        }),
      );

      setProblemRoadmapMap((prev) => {
        const next = { ...prev };
        delete next[String(problem.bojId)];
        return next;
      });
    } catch {
      setActionError("문제 제거에 실패했습니다.");
    }
  }

  const selectedProblem = selectedProblemId
    ? problems.find((problem) => problem.id === selectedProblemId)
    : null;
  const selectedRoadmapIds = selectedProblem ? (problemRoadmapMap[String(selectedProblem.bojId)] ?? []) : [];
  const availableRoadmaps = roadmaps.filter((roadmap) => !selectedRoadmapIds.includes(roadmap.id));

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
          <div className="grid gap-3 lg:grid-cols-[1.5fr_0.5fr_0.7fr]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="문제명 또는 BOJ 번호 검색"
                className="rounded-xl border-gray-200 bg-white pl-9"
              />
            </div>
            <Select value={tierPreset} onValueChange={(value) => setTierPreset(value as TierPreset)}>
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
            <Select
              value={tagPreset}
              onValueChange={(value) => setTagPreset(value as TagPreset)}
            >
              <SelectTrigger className="rounded-xl border-gray-200 bg-white">
                <SelectValue placeholder="태그 선택" />
              </SelectTrigger>
              <SelectContent>
                {tagPresetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-3">
          {loadError ? <p className="text-sm text-red-500">{loadError}</p> : null}
          {actionError ? <p className="text-sm text-red-500">{actionError}</p> : null}
          {!groupId ? (
            <p className="text-sm text-amber-600">그룹이 없어 로드맵 담기 기능은 비활성화됩니다.</p>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="border border-blue-200 bg-[#F2F7FF] text-[#0F46D8]">
                        {tierLabel(problem.level)}
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
                      <Badge key={tag} className="border border-gray-200 bg-white text-gray-600">
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
                      onClick={() => handleOpenAddDialog(problem.id)}
                      disabled={!groupId || roadmaps.length === 0}
                    >
                      로드맵에 담기
                    </Button>
                    {inRoadmap ? (
                      <Button
                        variant="outline"
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => void handleRemoveFromRoadmap(problem)}
                        disabled={!groupId}
                      >
                        모두 빼기
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
        </section>

        {/* 페이지네이션 */}
        {currentPage > 1 || !isLastPage ? (
          <Pagination className="mt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from(
                {
                  length: Math.min(
                    5,
                    isLastPage ? currentPage : currentPage + 2,
                  ),
                },
                (_, i) => {
                  const start = Math.max(1, currentPage - 2);
                  const page = start + i;
                  if (isLastPage && page > currentPage) return null;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                },
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLastPage) setCurrentPage((p) => p + 1);
                  }}
                  className={isLastPage ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>로드맵에 담기</DialogTitle>
              <DialogDescription>담을 로드맵을 선택하세요.</DialogDescription>
            </DialogHeader>
            <Select value={selectedRoadmapId} onValueChange={setSelectedRoadmapId}>
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
              <p className="text-sm text-muted-foreground">이미 모든 로드맵에 담긴 문제입니다.</p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={() => void handleAddToRoadmap()}
                disabled={!selectedRoadmapId || availableRoadmaps.length === 0 || !groupId}
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
