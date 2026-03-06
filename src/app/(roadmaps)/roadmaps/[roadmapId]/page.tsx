"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Layers3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Problem {
  bojId: number;
  title: string;
  level: number;
}

interface Step {
  id: number;
  order: number;
  title: string;
  description: string | null;
  problems: Problem[];
}

interface RoadmapInfo {
  id: number;
  title: string;
  description: string | null;
  creatorName: string;
  isOwner: boolean;
}

const tierInfo = (level: number): { label: string; color: string } => {
  if (level === 0) return { label: "Unrated", color: "bg-gray-100 text-gray-500 border-gray-200" };
  if (level <= 5) return { label: "Bronze", color: "bg-amber-50 text-amber-700 border-amber-200" };
  if (level <= 10) return { label: "Silver", color: "bg-slate-100 text-slate-600 border-slate-200" };
  if (level <= 15) return { label: "Gold", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  if (level <= 20) return { label: "Platinum", color: "bg-teal-50 text-teal-700 border-teal-200" };
  return { label: "Diamond+", color: "bg-blue-50 text-blue-700 border-blue-200" };
};

export default function RoadmapDetailPage() {
  const params = useParams<{ roadmapId: string }>();
  const roadmapId = params?.roadmapId ?? "";

  const [roadmap, setRoadmap] = useState<RoadmapInfo | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 뮤테이션용 groupId (내 그룹 중 이 로드맵을 가진 그룹)
  const [groupId, setGroupId] = useState<number | null>(null);

  // 스텝 추가 인라인 상태
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const newStepInputRef = useRef<HTMLInputElement>(null);

  // 로드맵 데이터 로딩 (팀 없이 직접 조회)
  useEffect(() => {
    if (!roadmapId) return;
    setLoading(true);
    fetch(`/api/roadmaps/${roadmapId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setRoadmap(data.roadmap);
        setSteps(data.steps ?? []);
      })
      .catch(() => setError("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [roadmapId]);

  // 뮤테이션용 groupId 조회 (내 그룹 중 이 로드맵을 포함한 그룹 찾기)
  useEffect(() => {
    if (!roadmapId) return;
    fetch("/api/group")
      .then((r) => r.json())
      .then(async (groups) => {
        if (!Array.isArray(groups) || groups.length === 0) return;
        const firstGroupId = Number(groups[0]?.id);
        if (!Number.isNaN(firstGroupId)) {
          setGroupId(firstGroupId);
        }
        for (const group of groups) {
          const res = await fetch(`/api/group/${group.id}`);
          const data = await res.json();
          const found = (data.roadmaps ?? []).some(
            (rm: { id: number }) => rm.id === Number(roadmapId)
          );
          if (found) {
            setGroupId(group.id);
            break;
          }
        }
      })
      .catch(() => {});
  }, [roadmapId]);

  useEffect(() => {
    if (isAddingStep) newStepInputRef.current?.focus();
  }, [isAddingStep]);

  const summary = useMemo(() => {
    const allProblems = steps.flatMap((s) => s.problems);
    return {
      stepCount: steps.length,
      problemCount: allProblems.length,
      hardest: Math.max(...allProblems.map((p) => p.level), 0),
    };
  }, [steps]);

  function refreshSteps() {
    fetch(`/api/roadmaps/${roadmapId}`)
      .then((r) => r.json())
      .then((data) => setSteps(data.steps ?? []));
  }

  async function handleAddStep() {
    if (!newStepTitle.trim() || !groupId || !roadmap?.isOwner) return;
    setAddingStep(true);
    try {
      const res = await fetch(`/api/group/${groupId}/roadmap-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId: Number(roadmapId), title: newStepTitle.trim() }),
      });
      const step = await res.json();
      setSteps((prev) => [...prev, { ...step, problems: [] }]);
      setNewStepTitle("");
      setIsAddingStep(false);
    } catch {
      // 실패 시 무시
    } finally {
      setAddingStep(false);
    }
  }

  async function handleDeleteProblem(bojId: number) {
    if (!groupId || !roadmap?.isOwner) return;
    setSteps((prev) =>
      prev.map((s) => ({ ...s, problems: s.problems.filter((p) => p.bojId !== bojId) }))
    );
    try {
      await fetch(`/api/group/${groupId}/roadmap-problems`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bojId, roadmapId: Number(roadmapId) }),
      });
    } catch {
      refreshSteps();
    }
  }

  async function handleMoveProblem(bojId: number, fromStepId: number, toStepId: number) {
    if (!groupId || !roadmap?.isOwner) return;
    setSteps((prev) => {
      const problem = prev
        .find((s) => s.id === fromStepId)
        ?.problems.find((p) => p.bojId === bojId);
      if (!problem) return prev;
      return prev.map((s) => {
        if (s.id === fromStepId) return { ...s, problems: s.problems.filter((p) => p.bojId !== bojId) };
        if (s.id === toStepId) return { ...s, problems: [...s.problems, problem] };
        return s;
      });
    });
    try {
      await fetch(`/api/group/${groupId}/roadmap-problems`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bojId, fromStepId, toStepId }),
      });
    } catch {
      refreshSteps();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="animate-pulse text-sm text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  if (error || (!loading && !roadmap)) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-800">로드맵을 찾을 수 없습니다.</p>
            <p className="mt-1 text-sm text-slate-500">{error || "목록으로 돌아가서 다시 선택해 주세요."}</p>
            <Button asChild variant="outline" className="mt-4 rounded-xl border-blue-200 text-[#0F46D8]">
              <Link href="/roadmaps">목록으로</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6">

        {/* 헤더 */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-400">트랙 상세</p>
                <h1 className="text-2xl font-bold text-gray-900">{roadmap?.title}</h1>
                <p className="mt-1 text-sm text-gray-400">{roadmap?.description || "설명 없음"}</p>
                <p className="mt-1 text-xs text-gray-400">작성자: {roadmap?.creatorName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="rounded-lg border-gray-200 text-[#0F46D8] hover:bg-gray-50">
                  <Link href="/roadmaps">
                    <ArrowLeft className="size-4" />
                    목록으로
                  </Link>
                </Button>
                {groupId && roadmap?.isOwner && (
                  <Button asChild className="rounded-lg bg-[#0F46D8] text-white hover:bg-[#0A37B0]">
                    <Link href={`/problems?roadmapId=${roadmapId}`}>
                      <Plus className="size-4" />
                      문제 추가
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3 grid-cols-3">
              {[
                { icon: <Layers3 size={14} />, label: "총 단계", value: summary.stepCount },
                { icon: <BookOpen size={14} />, label: "담긴 문제", value: summary.problemCount },
                { icon: null, label: "최고 난이도", value: summary.hardest || "-" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-3.5">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                    {icon}{value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 스텝 목록 */}
        <div className="space-y-3">
          {steps.length === 0 && !isAddingStep && (
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
              {groupId && roadmap?.isOwner
                ? "스텝을 추가해서 문제를 단계별로 관리해보세요."
                : "아직 담긴 문제가 없습니다."}
            </div>
          )}

          {steps.map((step) => (
            <section key={step.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/60 px-5 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F46D8] text-[11px] font-bold text-white">
                  {step.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                  {step.description && (
                    <p className="text-xs text-gray-400">{step.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">{step.problems.length}문제</span>
              </div>

              {step.problems.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-gray-300">
                  이 단계에 담긴 문제가 없습니다.
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {step.problems.map((problem) => {
                    const tier = tierInfo(problem.level);
                    return (
                      <li key={problem.bojId} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                        <p className="min-w-0 truncate text-sm font-medium text-gray-800">
                          {problem.bojId}. {problem.title}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge className={`border text-xs ${tier.color}`}>
                            {tier.label} {problem.level}
                          </Badge>
                          {groupId && roadmap?.isOwner && steps.length > 1 && (
                            <Select
                              value={String(step.id)}
                              onValueChange={(val) =>
                                handleMoveProblem(problem.bojId, step.id, Number(val))
                              }
                            >
                              <SelectTrigger className="h-7 w-auto gap-1 rounded-lg border-gray-200 px-2.5 text-xs text-gray-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {steps.map((s) => (
                                  <SelectItem key={s.id} value={String(s.id)}>
                                    STEP {s.order}. {s.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg border-gray-200 px-2.5 text-xs text-[#0F46D8] hover:bg-gray-50"
                          >
                            <a
                              href={`https://www.acmicpc.net/problem/${problem.bojId}`}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              풀기
                            </a>
                          </Button>
                          {groupId && roadmap?.isOwner && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 rounded-lg border-red-100 p-0 text-red-400 hover:bg-red-50 hover:text-red-500"
                              onClick={() => handleDeleteProblem(problem.bojId)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}

          {/* 스텝 추가 (내 그룹에 속한 로드맵일 때만) */}
          {groupId && roadmap?.isOwner && (
            isAddingStep ? (
              <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-sm">
                <input
                  ref={newStepInputRef}
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddStep();
                    if (e.key === "Escape") { setIsAddingStep(false); setNewStepTitle(""); }
                  }}
                  placeholder="스텝 이름 입력..."
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                />
                <Button
                  size="sm"
                  onClick={handleAddStep}
                  disabled={!newStepTitle.trim() || addingStep}
                  className="h-7 rounded-lg bg-[#0F46D8] px-2.5 text-white hover:bg-[#0A37B0]"
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setIsAddingStep(false); setNewStepTitle(""); }}
                  className="h-7 w-7 rounded-lg p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingStep(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 py-3 text-sm text-gray-400 transition-colors hover:border-[#0F46D8]/30 hover:text-[#0F46D8]"
              >
                <Plus className="size-4" />
                새 스텝 추가
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
