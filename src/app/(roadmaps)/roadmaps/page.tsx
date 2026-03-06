"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FolderKanban,
  Layers3,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Roadmap = {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  creatorName: string;
  isOwner: boolean;
  problemsCount: number;
  teamId: number | null;
  teamName: string | null;
};

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadRoadmaps(signal?: AbortSignal) {
    setError("");
    try {
      const res = await fetch("/api/roadmaps", { cache: "no-store", signal });
      if (!res.ok) throw new Error("로드맵 조회 실패");
      const data = (await res.json()) as { items?: Roadmap[] };
      setRoadmaps(data.items ?? []);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError("로드맵 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadRoadmaps(controller.signal);
    return () => controller.abort();
  }, []);

  const sortedRoadmaps = useMemo(
    () =>
      [...roadmaps].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [roadmaps],
  );

  const summary = useMemo(() => {
    const totalProblems = roadmaps.reduce(
      (sum, roadmap) => sum + roadmap.problemsCount,
      0,
    );
    const maxProblems = Math.max(
      ...roadmaps.map((roadmap) => roadmap.problemsCount),
      0,
    );
    return {
      trackCount: roadmaps.length,
      totalProblems,
      avgProblems:
        roadmaps.length > 0
          ? Math.round((totalProblems / roadmaps.length) * 10) / 10
          : 0,
      maxProblems,
    };
  }, [roadmaps]);

  async function handleCreateRoadmap() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "로드맵 생성 실패");
      }
      setTitle("");
      setDescription("");
      setCreateOpen(false);
      await loadRoadmaps();
    } catch (e) {
      setError(e instanceof Error ? e.message : "로드맵 생성 실패");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteRoadmap(roadmapId: number) {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/roadmaps", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "로드맵 삭제 실패");
      }
      await loadRoadmaps();
    } catch (e) {
      setError(e instanceof Error ? e.message : "로드맵 삭제 실패");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-400">로드맵</p>
                <h1 className="text-2xl font-bold text-gray-900">
                  로드맵 관리
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  DB에 있는 모든 로드맵을 조회/생성/삭제합니다.
                </p>
              </div>

              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-2xl bg-[#0F46D8] text-white hover:bg-[#0A37B0]">
                    <Plus className="size-4" />새 로드맵
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>새 로드맵 생성</DialogTitle>
                    <DialogDescription>
                      생성 후 문제 검색 페이지에서 바로 담을 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">제목</label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="예: DP 기초 트랙"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">설명</label>
                      <Input
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="예: 점화식 기반 핵심 문제 모음"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={() => void handleCreateRoadmap()}
                      disabled={!title.trim() || isSaving}
                      className="bg-[#0F46D8] text-white hover:bg-[#0A37B0]"
                    >
                      생성
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Layers3 size={14} />,
                  label: "트랙 수",
                  value: summary.trackCount,
                },
                {
                  icon: <FolderKanban size={14} />,
                  label: "총 문제 수",
                  value: summary.totalProblems,
                },
                {
                  icon: null,
                  label: "트랙당 평균",
                  value: summary.avgProblems,
                },
                {
                  icon: null,
                  label: "최대 문제 수",
                  value: summary.maxProblems,
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 p-3.5"
                >
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                    {icon}
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sortedRoadmaps.map((roadmap, index) => {
            const intensity = Math.min(
              100,
              Math.max(12, roadmap.problemsCount * 12),
            );

            const detailHref = `/roadmaps/${roadmap.id}`;

            return (
              <article
                key={roadmap.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-gray-200"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600">
                      TRACK {index + 1}
                    </p>
                    <h2 className="mt-0.5 text-lg font-semibold text-slate-800">
                      {roadmap.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {roadmap.description || "설명 없음"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      작성자: {roadmap.creatorName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">문제 수</p>
                    <p className="text-base font-bold text-[#0F46D8]">
                      {roadmap.problemsCount}
                    </p>
                  </div>
                </div>

                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#0F46D8]"
                    style={{ width: `${intensity}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays size={13} />
                    {new Date(roadmap.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-gray-200 text-[#0F46D8] hover:bg-gray-50"
                    >
                      <Link href={detailHref}>상세 보기</Link>
                    </Button>
                    {roadmap.isOwner ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => void handleDeleteRoadmap(roadmap.id)}
                        disabled={isSaving}
                      >
                        <Trash2 className="size-4" />
                        삭제
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
