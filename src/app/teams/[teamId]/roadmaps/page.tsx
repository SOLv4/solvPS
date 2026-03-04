"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, FolderKanban, Layers3, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createMockRoadmap, getMockRoadmaps, type Roadmap } from "@/lib/mock";

export default function TeamRoadmapsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId ?? "1";

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(() => getMockRoadmaps());
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const sortedRoadmaps = useMemo(
    () => [...roadmaps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [roadmaps]
  );

  const summary = useMemo(() => {
    const totalProblems = roadmaps.reduce((sum, roadmap) => sum + roadmap.problemsCount, 0);
    const maxProblems = Math.max(...roadmaps.map((roadmap) => roadmap.problemsCount), 0);
    return {
      trackCount: roadmaps.length,
      totalProblems,
      avgProblems: roadmaps.length > 0 ? Math.round((totalProblems / roadmaps.length) * 10) / 10 : 0,
      maxProblems,
    };
  }, [roadmaps]);

  function handleCreateRoadmap() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const nextRoadmap = createMockRoadmap({
      title: trimmedTitle,
      description,
      orderSeed: roadmaps.length + 1,
    });
    setRoadmaps((prev) => [nextRoadmap, ...prev]);
    setTitle("");
    setDescription("");
    setCreateOpen(false);
  }

  function handleDeleteRoadmap(roadmapId: string) {
    setRoadmaps((prev) => prev.filter((roadmap) => roadmap.id !== roadmapId));
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
              <p className="text-xs font-semibold tracking-wider text-blue-700">LEARNING TRACK STUDIO</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">로드맵 관리</h1>
              <p className="mt-2 text-sm text-slate-600">팀 단위 학습 경로를 설계하고, 문제를 트랙별로 관리하세요.</p>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl bg-[#0F46D8] text-white hover:bg-[#0A37B0]">
                  <Plus className="size-4" />
                  새 로드맵
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>새 로드맵 생성</DialogTitle>
                  <DialogDescription>학습 목적에 맞는 트랙을 만들어 팀과 공유하세요.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">제목</label>
                    <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: DP 기초 트랙" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">설명</label>
                    <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="예: 점화식 기반 핵심 문제 모음" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
                  <Button onClick={handleCreateRoadmap} disabled={!title.trim()} className="bg-[#0F46D8] text-white hover:bg-[#0A37B0]">
                    생성
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">트랙 수</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <Layers3 size={16} />
                {summary.trackCount}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">총 문제 수</p>
              <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                <FolderKanban size={16} />
                {summary.totalProblems}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">트랙당 평균</p>
              <p className="mt-1 text-xl font-bold text-[#0F46D8]">{summary.avgProblems}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
              <p className="text-xs text-slate-500">최대 문제 수</p>
              <p className="mt-1 text-xl font-bold text-[#0F46D8]">{summary.maxProblems}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedRoadmaps.map((roadmap, index) => {
          const intensity = Math.min(100, Math.max(12, roadmap.problemsCount * 12));
          return (
            <article key={roadmap.id} className="rounded-3xl border border-blue-100/90 bg-gradient-to-b from-white/80 to-[#f8faff]/85 p-5 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_30px_70px_-44px_rgba(0,70,254,0.65)]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-blue-600">TRACK {index + 1}</p>
                  <h2 className="mt-0.5 text-lg font-semibold text-slate-800">{roadmap.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{roadmap.description || "설명 없음"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">문제 수</p>
                  <p className="text-base font-bold text-[#0F46D8]">{roadmap.problemsCount}</p>
                </div>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0F46D8] to-[#6B92FF]" style={{ width: `${intensity}%` }} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <CalendarDays size={13} />
                  {new Date(roadmap.createdAt).toLocaleDateString("ko-KR")}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-xl border-blue-200 text-[#0F46D8] hover:bg-[#F4F8FF]">
                    <Link href={`/teams/${teamId}/roadmaps/${roadmap.id}`}>상세 보기</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteRoadmap(roadmap.id)}>
                    <Trash2 className="size-4" />
                    삭제
                  </Button>
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
