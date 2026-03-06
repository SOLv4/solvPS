"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  tagPresetOptions,
  tierPresetOptions,
  type Problem,
  type TagPreset,
  type TierPreset,
} from "@/lib/mock";

type Roadmap = {
  id: number;
  title: string;
  isOwner: boolean;
};
type Group = { id: number;[key: string]: unknown };

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
const GRADE_LABELS = ["V", "IV", "III", "II", "I"];

const tierLabel = (level: number) => {
  if (level === 0) return "Unrated";
  const tier = Math.ceil(level / 5); // 1=브론즈 ~ 6=루비
  const grade = GRADE_LABELS[(level - 1) % 5];
  return `${TIER_NAMES[tier]} ${grade}`;
};

export default function ProblemsPage() {
  const searchParams = useSearchParams();
  const initialRoadmapId = searchParams.get("roadmapId") ?? "";
  const initialStepId = searchParams.get("stepId") ?? "";
  const isStepTargetMode = initialStepId !== "";

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

  const [actionError, setActionError] = useState("");
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>("");
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);

  const [problemRoadmapMap, setProblemRoadmapMap] = useState<
    Record<string, number[]>
  >({});

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
          fetch("/api/roadmaps", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch(`/api/group/${groupId}/roadmap-problems`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (roadmapsRes.ok) {
          const roadmapsData = (await roadmapsRes.json()) as {
            items?: Array<{ id: number; title: string; isOwner: boolean }>;
          };
          setRoadmaps(
            (roadmapsData.items ?? [])
              .filter((item) => item.isOwner)
              .map((item) => ({
                id: item.id,
                title: item.title,
                isOwner: item.isOwner,
              })),
          );
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
    if (roadmaps.length === 0) {
      setSelectedRoadmapId("");
      return;
    }
    if (initialRoadmapId) {
      const existsInitial = roadmaps.some(
        (roadmap) => String(roadmap.id) === initialRoadmapId,
      );
      if (existsInitial && selectedRoadmapId !== initialRoadmapId) {
        setSelectedRoadmapId(initialRoadmapId);
        return;
      }
    }
    const exists = roadmaps.some((roadmap) => String(roadmap.id) === selectedRoadmapId);
    if (!exists) {
      setSelectedRoadmapId(String(roadmaps[0].id));
    }
  }, [roadmaps, selectedRoadmapId, initialRoadmapId]);

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
    const tags = problems.flatMap((problem) => problem.tags);
    const topTag = Object.entries(
      tags.reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      total: problems.length,
      topTag: topTag ? `${topTag[0]} (${topTag[1]})` : "-",
    };
  }, [problems]);

  function isInSelectedRoadmap(problem: Problem) {
    if (!selectedRoadmapId) return false;
    const roadmapIds = problemRoadmapMap[String(problem.bojId)] ?? [];
    return roadmapIds.includes(Number(selectedRoadmapId));
  }

  function handleToggleProblem(problem: Problem) {
    if (!selectedRoadmapId || isInSelectedRoadmap(problem)) return;
    setSelectedProblemIds((prev) =>
      prev.includes(problem.id)
        ? prev.filter((id) => id !== problem.id)
        : [...prev, problem.id],
    );
  }

  async function handleAddSelectedToRoadmap() {
    if (!groupId || !selectedRoadmapId || selectedProblemIds.length === 0) return;
    const selectedRoadmap = roadmaps.find(
      (roadmap) => String(roadmap.id) === selectedRoadmapId,
    );
    if (!selectedRoadmap?.isOwner) {
      setActionError("로드맵 작성자만 문제를 담을 수 있습니다.");
      return;
    }
    const targetProblems = problems.filter(
      (problem) =>
        selectedProblemIds.includes(problem.id) && !isInSelectedRoadmap(problem),
    );
    if (targetProblems.length === 0) return;

    try {
      const results = await Promise.all(
        targetProblems.map((problem) =>
          fetch(`/api/group/${groupId}/roadmap-problems`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bojId: problem.bojId,
              title: problem.title,
              level: problem.level,
              roadmapId: Number(selectedRoadmapId),
              stepId: isStepTargetMode ? Number(initialStepId) : undefined,
            }),
          }),
        ),
      );

      const failed = results.find((res) => !res.ok);
      if (failed) {
        const data = (await failed.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "로드맵 추가 실패");
      }

      setProblemRoadmapMap((prev) => {
        const next = { ...prev };
        targetProblems.forEach((problem) => {
          const key = String(problem.bojId);
          const prevIds = next[key] ?? [];
          if (!prevIds.includes(Number(selectedRoadmapId))) {
            next[key] = [...prevIds, Number(selectedRoadmapId)];
          }
        });
        return next;
      });
      setSelectedProblemIds([]);
      setActionError("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "로드맵 추가 실패");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-gray-400">문제 검색</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              문제 검색
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              난이도/태그 기준으로 문제를 필터링하고 선택한 로드맵에 담으세요.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-3.5">
              <p className="text-xs text-gray-400">검색 결과</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Search size={16} />
                {summary.total}
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
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <Select
            value={selectedRoadmapId}
            onValueChange={setSelectedRoadmapId}
            disabled={isStepTargetMode}
          >
            <SelectTrigger className="rounded-xl border-blue-200 bg-white">
              <SelectValue placeholder="담을 로드맵 선택" />
            </SelectTrigger>
            <SelectContent>
              {roadmaps.map((roadmap) => (
                <SelectItem key={roadmap.id} value={String(roadmap.id)}>
                  {roadmap.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => void handleAddSelectedToRoadmap()}
            disabled={
              !groupId ||
              !selectedRoadmapId ||
              selectedProblemIds.length === 0 ||
              !roadmaps.find((roadmap) => String(roadmap.id) === selectedRoadmapId)?.isOwner
            }
            className="rounded-xl bg-[#0F46D8] text-white hover:bg-[#0A37B0]"
          >
            선택 문제 담기 ({selectedProblemIds.length})
          </Button>
        </div>
        {isStepTargetMode ? (
          <p className="mt-2 text-xs text-gray-500">
            스텝에서 이동한 상태입니다. 선택한 문제는 지정된 스텝에 바로 추가됩니다.
          </p>
        ) : null}
      </section>
      <section className="space-y-3">
        {loadError ? (
          <p className="text-sm text-red-500">{loadError}</p>
        ) : null}
        {actionError ? (
          <p className="text-sm text-red-500">{actionError}</p>
        ) : null}
        {!groupId ? (
          <p className="text-sm text-amber-600">
            그룹이 없어 로드맵 담기 기능은 비활성화됩니다.
          </p>
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
                    variant={selectedProblemIds.includes(problem.id) ? "default" : "outline"}
                    className={
                      selectedProblemIds.includes(problem.id)
                        ? "rounded-xl bg-[#0F46D8] text-white hover:bg-[#0A37B0]"
                        : "rounded-xl border-blue-200 text-[#0F46D8] hover:bg-[#F4F8FF]"
                    }
                    onClick={() => handleToggleProblem(problem)}
                    disabled={
                      !groupId ||
                      !selectedRoadmapId ||
                      isInSelectedRoadmap(problem) ||
                      !roadmaps.find((roadmap) => String(roadmap.id) === selectedRoadmapId)?.isOwner
                    }
                  >
                    {isInSelectedRoadmap(problem)
                      ? "이미 선택 로드맵에 담김"
                      : selectedProblemIds.includes(problem.id)
                        ? "선택됨"
                        : "선택"}
                  </Button>
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
    </div>
  );
}
