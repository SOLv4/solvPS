"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Layers3, Search, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMockProblems, getMockRoadmaps, tierPresetOptions, type Problem, type TierPreset } from "@/lib/mock";

const tierBand = (level: number) => {
  if (level <= 5) return "브론즈";
  if (level <= 10) return "실버";
  if (level <= 15) return "골드";
  return "상위 티어";
};

export default function TeamProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [roadmaps] = useState(() => getMockRoadmaps());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [q, setQ] = useState("");
  const [tierPreset, setTierPreset] = useState<TierPreset>("all");
  const [tagQuery, setTagQuery] = useState("");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>("");

  const [problemRoadmapMap, setProblemRoadmapMap] = useState<Record<string, string>>(() => {
    const defaultRoadmapId = getMockRoadmaps()[0]?.id ?? "";
    return getMockProblems().reduce<Record<string, string>>((acc, problem) => {
      if (problem.inRoadmap && defaultRoadmapId) {
        acc[problem.id] = defaultRoadmapId;
      }
      return acc;
    }, {});
  });

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
      inRoadmap: Boolean(problemRoadmapMap[problem.id]),
    }));
    const inRoadmapCount = mapped.filter((problem) => problem.inRoadmap).length;
    const avgLevel = mapped.length > 0 ? Math.round((mapped.reduce((sum, p) => sum + p.level, 0) / mapped.length) * 10) / 10 : 0;
    const tags = mapped.flatMap((problem) => problem.tags);
    const topTag = Object.entries(
      tags.reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      total: mapped.length,
      inRoadmapCount,
      avgLevel,
      topTag: topTag ? `${topTag[0]} (${topTag[1]})` : "-",
    };
  }, [problems, problemRoadmapMap]);

  function handleOpenAddDialog(problemId: string) {
    setSelectedProblemId(problemId);
    const alreadySelected = problemRoadmapMap[problemId];
    setSelectedRoadmapId(alreadySelected ?? roadmaps[0]?.id ?? "");
    setAddDialogOpen(true);
  }

  function handleAddToRoadmap() {
    if (!selectedProblemId || !selectedRoadmapId) return;
    setProblemRoadmapMap((prev) => ({ ...prev, [selectedProblemId]: selectedRoadmapId }));
    setAddDialogOpen(false);
  }

  function handleRemoveFromRoadmap(problemId: string) {
    setProblemRoadmapMap((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
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
          <div>
            <p className="text-xs font-semibold tracking-wider text-blue-700">PROBLEM DISCOVERY BOARD</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">문제 검색</h1>
            <p className="mt-2 text-sm text-slate-600">난이도/태그 기준으로 문제를 필터링하고 바로 로드맵에 편입하세요.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">검색 결과</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Search size={16} />
                {summary.total}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">로드맵 편입</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Layers3 size={16} />
                {summary.inRoadmapCount}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">평균 난이도</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Target size={16} />
                {summary.avgLevel || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">주요 태그</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Sparkles size={16} />
                <span className="truncate">{summary.topTag}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-5 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={17} className="text-[#0F46D8]" />
          <h2 className="text-base font-semibold text-slate-800">필터</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="문제명 또는 BOJ 번호 검색" className="rounded-xl border-blue-200 bg-white/80 pl-9 backdrop-blur-sm" />
          </div>
          <Select value={tierPreset} onValueChange={(value) => setTierPreset(value as TierPreset)}>
            <SelectTrigger className="rounded-xl border-blue-200 bg-white/80 backdrop-blur-sm">
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
          <Input value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} placeholder="태그 필터 (예: 그래프, DP)" className="rounded-xl border-blue-200 bg-white/80 backdrop-blur-sm" />
        </div>
      </section>

      <section className="space-y-3">
        {loadError ? <p className="text-sm text-red-500">{loadError}</p> : null}
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">검색 결과를 불러오는 중...</div>
        ) : null}
        {!isLoading && problems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">검색 결과가 없습니다.</div>
        ) : null}

        {!isLoading &&
          problems.map((problem) => {
            const inRoadmap = Boolean(problemRoadmapMap[problem.id]);
            return (
              <article key={problem.id} className="rounded-3xl border border-blue-100/90 bg-gradient-to-b from-white/80 to-[#f8faff]/85 p-4 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-44px_rgba(0,70,254,0.65)]">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {problem.bojId}. {problem.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">난이도 대역: {tierBand(problem.level)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="border border-blue-200 bg-[#F2F7FF] text-[#0F46D8]">Lv {problem.level}</Badge>
                    <Badge className={inRoadmap ? "border border-blue-200 bg-[#0F46D8] text-white" : "border border-slate-200 bg-white text-slate-600"}>
                      {inRoadmap ? "로드맵 편입" : "미편입"}
                    </Badge>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {problem.tags.map((tag) => (
                    <Badge key={tag} className="border border-blue-200 bg-white text-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  {inRoadmap ? (
                    <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveFromRoadmap(problem.id)}>
                      빼기
                    </Button>
                  ) : (
                    <Button className="rounded-xl bg-[#0F46D8] text-white hover:bg-[#0A37B0]" onClick={() => handleOpenAddDialog(problem.id)}>
                      로드맵에 담기
                    </Button>
                  )}
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
          <Select value={selectedRoadmapId} onValueChange={setSelectedRoadmapId}>
            <SelectTrigger className="w-full rounded-xl border-blue-200">
              <SelectValue placeholder="로드맵 선택" />
            </SelectTrigger>
            <SelectContent>
              {roadmaps.map((roadmap) => (
                <SelectItem key={roadmap.id} value={roadmap.id}>
                  {roadmap.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddToRoadmap} disabled={!selectedRoadmapId} className="bg-[#0F46D8] text-white hover:bg-[#0A37B0]">
              담기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
