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
  Map as MapIcon,
  Users,
  Zap,
  ExternalLink,
  Award,
  ArrowRight,
} from "lucide-react";
import RoadmapSection from "@/components/group/RoadmapSection";
import WeeklyStreakBoard, {
  WeeklyMember,
} from "@/components/group/WeeklyStreakBoard";

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

interface WeeklyActivityResponse {
  labels: string[];
  members: WeeklyMember[];
}

interface IntegrationSubmission {
  problemId: number;
  memberHandle: string;
  capturedAt: string;
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
  const [compareLoading, setCompareLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityResponse>({
    labels: [],
    members: [],
  });
  const [progress, setProgress] = useState<Record<number, boolean>>({});

  // 그룹 데이터 로드
  useEffect(() => {
    setLoading(true);
    fetch(`/api/group/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "그룹 정보를 불러오지 못했습니다.");
        setData(json);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  // 내 그룹 목록 로드
  useEffect(() => {
    fetch("/api/group")
      .then((r) => r.json())
      .then((groups) => {
        if (Array.isArray(groups)) setMyGroups(groups);
      })
      .catch(() => {});
  }, []);

  // 진행도 로드
  useEffect(() => {
    fetch(`/api/group/${id}/roadmap-progress`)
      .then((r) => r.json())
      .then((json) => {
        if (json && typeof json === "object") {
          const map: Record<number, boolean> = {};
          for (const [k, v] of Object.entries(json)) map[Number(k)] = Boolean(v);
          setProgress(map);
        }
      })
      .catch(() => {});
  }, [id]);

  // 코드 비교 로드
  useEffect(() => {
    if (!data?.team.id) return;
    setCompareLoading(true);
    fetch(`/api/group/${data.team.id}/compare`)
      .then(async (res) => {
        const json = await res.json();
        const items: IntegrationSubmission[] = Array.isArray(json.items) ? json.items : [];
        const grouped = new Map<
          number,
          { latestCapturedAt: string; memberSet: Set<string>; submissionCount: number }
        >();
        for (const item of items) {
          const current = grouped.get(item.problemId) ?? {
            latestCapturedAt: item.capturedAt,
            memberSet: new Set<string>(),
            submissionCount: 0,
          };
          current.memberSet.add(item.memberHandle);
          current.submissionCount += 1;
          if (new Date(item.capturedAt).getTime() > new Date(current.latestCapturedAt).getTime())
            current.latestCapturedAt = item.capturedAt;
          grouped.set(item.problemId, current);
        }
        setCompareItems(
          [...grouped.entries()]
            .map(([problemId, value]) => ({
              problemId,
              latestCapturedAt: value.latestCapturedAt,
              memberCount: value.memberSet.size,
              submissionCount: value.submissionCount,
            }))
            .sort((a, b) => new Date(b.latestCapturedAt).getTime() - new Date(a.latestCapturedAt).getTime())
            .slice(0, 12),
        );
      })
      .catch(() => setCompareItems([]))
      .finally(() => setCompareLoading(false));
  }, [data?.team.id]);

  // 주간 활동 로드
  useEffect(() => {
    setWeeklyLoading(true);
    fetch(`/api/group/${id}/weekly-activity`, { cache: "no-store" })
      .then(async (res) => {
        const raw = await res.text();
        const json = raw ? JSON.parse(raw) : {};
        if (!res.ok) throw new Error(json.error ?? "주간 활동 데이터를 불러오지 못했습니다.");
        setWeeklyActivity({
          labels: Array.isArray(json.labels) ? json.labels : [],
          members: Array.isArray(json.members) ? json.members : [],
        });
      })
      .catch(() => setWeeklyActivity({ labels: [], members: [] }))
      .finally(() => setWeeklyLoading(false));
  }, [id]);

  const copyInviteCode = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.team.invite_code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const copyTeamId = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(String(data.team.id));
    setCopiedTeamId(true);
    setTimeout(() => setCopiedTeamId(false), 2000);
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(integrationToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const issueToken = async () => {
    if (!data) return;
    setTokenLoading(true);
    setTokenError("");
    try {
      const res = await fetch(`/api/group/${data.team.id}/integration-token`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "토큰 발급에 실패했습니다.");
      setIntegrationToken(json.token ?? "");
    } catch (e: unknown) {
      setTokenError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setTokenLoading(false);
    }
  };

  const toggleProgress = async (stepId: number, completed: boolean) => {
    setProgress((prev) => ({ ...prev, [stepId]: completed }));
    try {
      await fetch(`/api/group/${id}/roadmap-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, completed }),
      });
    } catch {
      setProgress((prev) => ({ ...prev, [stepId]: !completed }));
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState message={error} />;

  const totalSteps = data.roadmaps.reduce((sum, r) => sum + r.steps.length, 0);
  const completedSteps = data.roadmaps.reduce(
    (sum, r) => sum + r.steps.filter((s) => progress[s.id]).length,
    0,
  );
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        {/* ── 메인 헤더 카드 ── */}
        <header className="overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-xl backdrop-blur-md">
          <div className="flex flex-col justify-between gap-6 p-8 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Group Dashboard
                </span>
              </div>
              <div className="relative inline-block">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-3 transition-transform active:scale-95"
                >
                  <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    {data.team.name}
                  </h1>
                  {myGroups.length > 1 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200">
                      <ChevronDown
                        size={20}
                        className={`text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  )}
                </button>
                {dropdownOpen && (
                  <div className="absolute left-0 top-full z-30 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {myGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          router.push(`/group/${group.id}`);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                          group.id === Number(id)
                            ? "bg-blue-50 font-bold text-blue-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm">{group.name}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] ${group.role === "OWNER" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {group.role === "OWNER" ? "팀장" : "멤버"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 pl-4 shadow-sm transition-all hover:border-blue-300">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Invite Code
                  </span>
                  <span className="font-mono text-sm font-black tracking-widest text-blue-600">
                    {data.team.invite_code}
                  </span>
                </div>
                <button
                  onClick={() => void copyInviteCode()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-blue-600 hover:text-white"
                >
                  {copiedInvite ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <button
                onClick={() => setIntegrationOpen((v) => !v)}
                className={`flex h-14 items-center gap-2 rounded-2xl px-6 text-sm font-bold shadow-sm transition-all ${
                  integrationOpen
                    ? "bg-slate-900 text-white shadow-slate-200"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <KeyRound
                  size={18}
                  className={integrationOpen ? "text-blue-400" : "text-slate-400"}
                />
                확장 프로그램 연동
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              {
                icon: Users,
                label: "활동 멤버",
                value: `${data.members.length}명`,
                color: "text-blue-600",
              },
              {
                icon: MapIcon,
                label: "보유 로드맵",
                value: `${data.roadmaps.length}개`,
                color: "text-emerald-600",
              },
              {
                icon: Zap,
                label: "전체 진행률",
                value: `${progressPercent}%`,
                sub: `${completedSteps}/${totalSteps}`,
                color: "text-amber-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-6 transition-colors hover:bg-slate-50/50"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm ${stat.color}`}
                >
                  <stat.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-tight text-slate-400">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black text-slate-800">{stat.value}</p>
                    {"sub" in stat && stat.sub && (
                      <span className="text-xs font-medium text-slate-400">({stat.sub})</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* ── Chrome 확장 연동 패널 ── */}
        {integrationOpen && (
          <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-1">
            <div className="rounded-[22px] bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Chrome Extension 설정</h2>
                    <p className="text-sm text-slate-500">
                      확장 프로그램에 아래 정보를 입력하여 실시간 제출 기록을 동기화하세요.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                    Team ID
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-800">{data.team.id}</span>
                    <button
                      onClick={() => void copyTeamId()}
                      className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-900 hover:text-white"
                    >
                      {copiedTeamId ? <Check size={14} /> : <Copy size={14} />}
                      {copiedTeamId ? "복사완료" : "복사하기"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                    API Access Token
                  </label>
                  {tokenError && (
                    <p className="mb-2 text-xs text-red-500">{tokenError}</p>
                  )}
                  <div className="flex items-center gap-3">
                    {integrationToken ? (
                      <div className="flex flex-1 items-center justify-between overflow-hidden rounded-xl border border-blue-100 bg-white py-2 pl-4 pr-2">
                        <span className="truncate font-mono text-sm text-blue-600">
                          {integrationToken}
                        </span>
                        <button
                          onClick={() => void copyToken()}
                          className="ml-2 rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                          {copiedToken ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => void issueToken()}
                        disabled={tokenLoading}
                        className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                      >
                        {tokenLoading ? "토큰 생성 중..." : "새 액세스 토큰 발급받기"}
                      </button>
                    )}
                    {integrationToken && (
                      <button
                        onClick={() => void issueToken()}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-slate-400 hover:text-blue-600"
                      >
                        <Zap size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 좌측: 랭킹 + 코드 비교 */}
          <div className="space-y-6 lg:col-span-8">
            {/* 주간 활동 랭킹 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Award size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">주간 활동 랭킹</h2>
              </div>
              <WeeklyStreakBoard
                labels={weeklyActivity.labels}
                members={weeklyActivity.members}
                loading={weeklyLoading}
              />
            </section>

            {/* 코드 비교 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Code2 size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">최근 제출된 코드 비교</h2>
              </div>

              {compareLoading ? (
                <div className="py-20 text-center text-slate-400">데이터를 불러오고 있습니다...</div>
              ) : compareItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 py-16 text-center">
                  <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-300">
                    <Code2 size={32} />
                  </div>
                  <p className="font-bold text-slate-500">수집된 코드가 없습니다.</p>
                  <p className="text-sm text-slate-400">확장 프로그램을 통해 백준 문제를 풀어보세요!</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {compareItems.map((item) => (
                    <Link
                      key={item.problemId}
                      href={`/problems/${item.problemId}/compare?teamId=${data.team.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                            Problem
                          </span>
                          <h3 className="text-xl font-black text-slate-800">#{item.problemId}</h3>
                        </div>
                        <div className="rounded-lg bg-white p-2 text-slate-400 shadow-sm transition-colors group-hover:bg-blue-600 group-hover:text-white">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(item.memberCount, 3))].map((_, i) => (
                            <div
                              key={i}
                              className="h-6 w-6 rounded-full border-2 border-white bg-slate-200"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          {item.memberCount}명의 코드
                        </span>
                        <span className="text-[10px] text-slate-300">|</span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.latestCapturedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 우측: 로드맵 */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <RoadmapSection
                roadmaps={data.roadmaps}
                progress={progress}
                onToggle={toggleProgress}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 animate-bounce items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
          <Zap className="text-white" fill="white" size={24} />
        </div>
        <p className="animate-pulse text-sm font-bold uppercase tracking-widest text-slate-400">
          Loading Dashboard...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <Zap size={32} />
        </div>
        <h2 className="mb-2 text-xl font-black text-slate-900">문제가 발생했습니다</h2>
        <p className="mb-6 text-sm text-slate-500">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition-transform active:scale-95"
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}
