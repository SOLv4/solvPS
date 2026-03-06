"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Code2,
  Copy,
  KeyRound,
  Trophy,
  ExternalLink,
  PlusCircle,
  Hash,
} from "lucide-react";
import RoadmapSection from "@/components/group/RoadmapSection";
import WeeklyStreakBoard, {
  WeeklyMember,
} from "@/components/group/WeeklyStreakBoard";

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-slate-100 rounded-full" />
            <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 w-40 bg-slate-100 rounded-2xl" />
            <div className="h-12 w-32 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Activity Board Skeleton */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 h-[400px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                <div className="h-3 w-48 bg-slate-100 rounded-lg" />
              </div>
            </div>
            <div className="w-full h-64 bg-slate-50 rounded-2xl" />
          </div>

          {/* Code Compare Skeleton */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                <div className="h-3 w-48 bg-slate-100 rounded-lg" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-50 rounded-[20px]" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 h-[600px]">
            <div className="h-6 w-32 bg-slate-200 rounded-lg mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Interfaces ---
interface Member {
  handle: string;
  role: string;
  tier: number;
  tierName: string;
  rating: number;
  solvedCount: number;
}
interface Step {
  id: number;
  order: number;
  title: string;
  description: string | null;
}
interface Roadmap {
  id: number;
  title: string;
  description: string | null;
  steps: Step[];
}
interface GroupData {
  team: { id: number; name: string; invite_code: string };
  members: Member[];
  roadmaps: Roadmap[];
}
interface MyGroup {
  id: number;
  name: string;
  role: string;
}
interface IntegrationSubmission {
  id: number;
  memberHandle: string;
  problemId: number;
  submissionId: string;
  capturedAt: string;
}
interface WeeklyActivityResponse {
  labels: string[];
  members: WeeklyMember[];
}
interface CatalogRoadmap {
  id: number;
  title: string;
}

export default function GroupDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [integrationToken, setIntegrationToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [compareItems, setCompareItems] = useState<
    {
      problemId: number;
      latestCapturedAt: string;
      memberCount: number;
      submissionCount: number;
    }[]
  >([]);
  const [compareLoading, setCompareLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityResponse>({
    labels: [],
    members: [],
  });
  const [catalogRoadmaps, setCatalogRoadmaps] = useState<CatalogRoadmap[]>([]);
  const [selectedCatalogRoadmapId, setSelectedCatalogRoadmapId] = useState("");
  const [addingRoadmap, setAddingRoadmap] = useState(false);
  const [addRoadmapError, setAddRoadmapError] = useState("");
  const [progress, setProgress] = useState<Record<number, boolean>>({});

  // --- Logic ---
  useEffect(() => {
    fetch("/api/group")
      .then((r) => r.json())
      .then((groups) => {
        if (Array.isArray(groups)) setMyGroups(groups);
      })
      .catch(() => { });
  }, []);

  const loadGroupData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/group/${id}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "그룹 정보를 불러오지 못했습니다.");
      }
      const json = (await res.json()) as GroupData;
      setData(json);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "그룹 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [id]);

  useEffect(() => {
    fetch(`/api/group/${id}/progress`)
      .then((r) => r.json())
      .then((p) => {
        if (p && typeof p === "object") setProgress(p);
      })
      .catch(() => { });
  }, [id]);

  const toggleProgress = async (stepId: number, completed: boolean) => {
    setProgress((prev) => ({ ...prev, [stepId]: completed }));
    try {
      await fetch(`/api/group/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, completed }),
      });
    } catch {
      setProgress((prev) => ({ ...prev, [stepId]: !completed }));
    }
  };

  useEffect(() => {
    if (!data?.team.id) return;
    setCompareLoading(true);
    fetch(`/api/integrations/boj/submissions?teamId=${data.team.id}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const raw = await res.text();
        const json = raw ? JSON.parse(raw) : {};
        if (!res.ok)
          throw new Error(
            json.error || "코드 비교 목록을 불러오지 못했습니다.",
          );
        const items: IntegrationSubmission[] = Array.isArray(json.items)
          ? json.items
          : [];
        const grouped = new Map<
          number,
          {
            latestCapturedAt: string;
            memberSet: Set<string>;
            submissionCount: number;
          }
        >();
        for (const item of items) {
          const current = grouped.get(item.problemId) ?? {
            latestCapturedAt: item.capturedAt,
            memberSet: new Set<string>(),
            submissionCount: 0,
          };
          current.memberSet.add(item.memberHandle);
          current.submissionCount += 1;
          if (
            new Date(item.capturedAt).getTime() >
            new Date(current.latestCapturedAt).getTime()
          ) {
            current.latestCapturedAt = item.capturedAt;
          }
          grouped.set(item.problemId, current);
        }
        const summary = [...grouped.entries()]
          .map(([problemId, value]) => ({
            problemId,
            latestCapturedAt: value.latestCapturedAt,
            memberCount: value.memberSet.size,
            submissionCount: value.submissionCount,
          }))
          .sort(
            (a, b) =>
              new Date(b.latestCapturedAt).getTime() -
              new Date(a.latestCapturedAt).getTime(),
          )
          .slice(0, 12);
        setCompareItems(summary);
      })
      .catch(() => setCompareItems([]))
      .finally(() => setCompareLoading(false));
  }, [data?.team.id]);

  useEffect(() => {
    setWeeklyLoading(true);
    fetch(`/api/group/${id}/weekly-activity`, { cache: "no-store" })
      .then(async (res) => {
        const raw = await res.text();
        const json = raw ? JSON.parse(raw) : {};
        if (!res.ok)
          throw new Error(
            json.error || "주간 활동 데이터를 불러오지 못했습니다.",
          );
        setWeeklyActivity({
          labels: Array.isArray(json.labels) ? json.labels : [],
          members: Array.isArray(json.members) ? json.members : [],
        });
      })
      .catch(() => setWeeklyActivity({ labels: [], members: [] }))
      .finally(() => setWeeklyLoading(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/roadmaps", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const items = Array.isArray(json.items) ? json.items : [];
        setCatalogRoadmaps(
          items.map((item: any) => ({ id: item.id, title: item.title })),
        );
      })
      .catch(() => setCatalogRoadmaps([]));
  }, []);

  const linkedRoadmapIds = new Set(
    (data?.roadmaps ?? []).map((roadmap) => roadmap.id),
  );
  const availableRoadmaps = catalogRoadmaps.filter(
    (roadmap) => !linkedRoadmapIds.has(roadmap.id),
  );

  useEffect(() => {
    if (availableRoadmaps.length === 0) {
      setSelectedCatalogRoadmapId("");
      return;
    }
    const exists = availableRoadmaps.some(
      (roadmap) => String(roadmap.id) === selectedCatalogRoadmapId,
    );
    if (!exists) setSelectedCatalogRoadmapId(String(availableRoadmaps[0].id));
  }, [availableRoadmaps, selectedCatalogRoadmapId]);

  const addRoadmapToGroup = async () => {
    if (!selectedCatalogRoadmapId) return;
    setAddingRoadmap(true);
    setAddRoadmapError("");
    try {
      const res = await fetch(`/api/group/${id}/roadmaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId: Number(selectedCatalogRoadmapId) }),
      });
      if (!res.ok) throw new Error("로드맵 추가 실패");
      await loadGroupData();
    } catch (e) {
      setAddRoadmapError("추가 중 오류 발생");
    } finally {
      setAddingRoadmap(false);
    }
  };

  const removeRoadmapFromGroup = async (roadmapId: number) => {
    try {
      const res = await fetch(`/api/group/${id}/roadmaps`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId }),
      });
      if (!res.ok) throw new Error("로드맵 제거 실패");
      await loadGroupData();
    } catch (e) {
      setAddRoadmapError("제거 중 오류 발생");
    }
  };

  const copyInviteCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.team.invite_code).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1800);
    });
  };
  const copyTeamId = () => {
    if (!data) return;
    navigator.clipboard.writeText(String(data.team.id)).then(() => {
      setCopiedTeamId(true);
      setTimeout(() => setCopiedTeamId(false), 1800);
    });
  };
  const copyToken = () => {
    if (!integrationToken) return;
    navigator.clipboard.writeText(integrationToken).then(() => {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 1800);
    });
  };
  const issueToken = async () => {
    if (!data) return;
    setTokenLoading(true);
    setTokenError("");
    try {
      const res = await fetch("/api/integrations/token", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "토큰 발급 실패");
      setIntegrationToken(json.token || "");
    } catch (e) {
      setTokenError("발급 실패");
    } finally {
      setTokenLoading(false);
    }
  };

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Hash size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          정보를 불러올 수 없습니다
        </h1>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button
          onClick={() => loadGroupData()}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (loading || !data) return <DashboardSkeleton />;

  return (
    <div className="pb-20">
      {/* 상단 헤더 배너 */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Dashboard
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-3 active:scale-95 transition-transform"
                >
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                    {data.team.name}
                  </h1>
                  {myGroups.length > 1 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200">
                      <ChevronDown
                        size={18}
                        className={`text-slate-500 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  )}
                </button>
                {dropdownOpen && myGroups.length > 1 && (
                  <div className="absolute left-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {myGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          router.push(`/group/${group.id}`);
                          setDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-4 text-left flex items-center justify-between transition-colors ${group.id === Number(id)
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <span className="text-sm">{group.name}</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">
                          {group.role === "OWNER" ? "팀장" : "멤버"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    Invite Code
                  </span>
                  <span className="text-sm font-mono font-black text-blue-600 tracking-wider">
                    {data.team.invite_code}
                  </span>
                </div>
                <button
                  onClick={copyInviteCode}
                  className={`p-2 rounded-xl transition-all ${copiedInvite ? "bg-green-500 text-white" : "bg-white text-slate-400 border border-slate-200 hover:text-blue-600"}`}
                >
                  {copiedInvite ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <button
                onClick={() => setIntegrationOpen((v) => !v)}
                className={`h-12 px-6 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 ${integrationOpen
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600"
                  }`}
              >
                <KeyRound size={18} />
                확장 프로그램
              </button>
            </div>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 mt-8 space-y-8">
        {/* ── 02. 연동 섹션 ── */}
        {integrationOpen && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-top-4">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <KeyRound size={20} className="text-blue-400" />
                <h2 className="text-sm font-bold">
                  크롬 확장 프로그램 설정 가이드
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://chromewebstore.google.com/detail/blnmcofelcnmojcpcpjonjilblgeehkp?utm_source=item-share-cb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-600/20"
                >
                  <PlusCircle size={14} />
                  확장프로그램 바로 추가하기
                </a>
                <button
                  onClick={() => setIntegrationOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="rotate-180" size={20} />
                </button>
              </div>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-6 bg-white">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Team ID
                  </span>
                  <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {data.team.id}
                    </span>
                    <button
                      onClick={copyTeamId}
                      className="text-xs font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {copiedTeamId ? "복사 완료" : "ID 복사"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                    Access Token
                  </span>
                  <div className="flex items-center gap-2">
                    {integrationToken ? (
                      <div className="flex-1 flex items-center justify-between bg-slate-50 border border-blue-100 rounded-2xl px-5 py-4 overflow-hidden">
                        <span className="text-xs font-mono text-blue-600 truncate">
                          {integrationToken}
                        </span>
                        <button
                          onClick={copyToken}
                          className={`p-2 rounded-lg transition-colors ${copiedToken ? "text-green-500" : "text-blue-600 hover:bg-blue-50"}`}
                        >
                          {copiedToken ? (
                            <Check size={18} />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={issueToken}
                        disabled={tokenLoading}
                        className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all"
                      >
                        {tokenLoading ? "발급 중..." : "팀 액세스 토큰 생성"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 03. 대시보드 메인 ── */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 좌측 메인 */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      주간 활동 랭킹
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      최근 7일간의 문제 풀이 기반
                    </p>
                  </div>
                </div>
              </div>
              <WeeklyStreakBoard
                labels={weeklyActivity.labels}
                members={weeklyActivity.members}
                loading={weeklyLoading}
              />
            </section>

            <section className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      팀 코드 비교
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      팀원들의 접근 방식을 공유하세요
                    </p>
                  </div>
                </div>
              </div>

              {compareLoading ? (
                <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-slate-50 rounded-[20px]" />
                  ))}
                </div>
              ) : compareItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-[24px]">
                  <Hash size={40} className="text-slate-200 mb-4" />
                  <p className="text-slate-400 text-sm font-bold">
                    수집된 기록이 없습니다
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {compareItems.map((item) => (
                    <Link
                      key={item.problemId}
                      href={`/problems/${item.problemId}/compare?teamId=${data.team.id}`}
                      className="group p-5 bg-slate-50 rounded-[20px] border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          PROB {item.problemId}
                        </div>
                        <div className="text-slate-300 group-hover:text-blue-500">
                          <ExternalLink size={16} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(item.memberCount, 4))].map(
                            (_, i) => (
                              <div
                                key={i}
                                className="h-6 w-6 rounded-full border-2 border-white bg-slate-200"
                              />
                            ),
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 tracking-tight">
                          {item.memberCount}명 참여 중
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 우측 사이드바 */}
          <aside>
            <div className="sticky top-8">
              <RoadmapSection
                roadmaps={data.roadmaps}
                progress={progress}
                onToggle={toggleProgress}
                onRemoveRoadmap={(roadmapId) =>
                  void removeRoadmapFromGroup(roadmapId)
                }
                action={
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedCatalogRoadmapId}
                          onChange={(e) =>
                            setSelectedCatalogRoadmapId(e.target.value)
                          }
                          disabled={
                            availableRoadmaps.length === 0 || addingRoadmap
                          }
                          className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                          {availableRoadmaps.length === 0 ? (
                            <option value="">참여 가능한 로드맵 없음</option>
                          ) : (
                            availableRoadmaps.map((r) => (
                              <option key={r.id} value={String(r.id)}>
                                {r.title}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                      <button
                        onClick={() => void addRoadmapToGroup()}
                        disabled={!selectedCatalogRoadmapId || addingRoadmap}
                        className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                        title="로드맵 추가"
                      >
                        {addingRoadmap ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <PlusCircle size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                }
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
