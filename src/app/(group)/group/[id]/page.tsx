"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Code2, Copy, KeyRound, Layers3, Trophy, Users } from "lucide-react";
import MemberRanking from "@/components/group/MemberRanking";
import RoadmapSection from "@/components/group/RoadmapSection";

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
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [integrationToken, setIntegrationToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [compareItems, setCompareItems] = useState<
    { problemId: number; latestCapturedAt: string; memberCount: number; submissionCount: number }[]
  >([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [progress, setProgress] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/group")
      .then((r) => r.json())
      .then((groups) => {
        if (Array.isArray(groups)) setMyGroups(groups);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/group/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "그룹 정보를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch(`/api/group/${id}/progress`)
      .then((r) => r.json())
      .then((p) => { if (p && typeof p === "object") setProgress(p); })
      .catch(() => {});
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
    fetch(`/api/integrations/boj/submissions?teamId=${data.team.id}`, { cache: "no-store" })
      .then(async (res) => {
        const raw = await res.text();
        const json = raw ? JSON.parse(raw) : {};
        if (!res.ok) throw new Error(json.error || "코드 비교 목록을 불러오지 못했습니다.");
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
          if (new Date(item.capturedAt).getTime() > new Date(current.latestCapturedAt).getTime()) {
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
          .sort((a, b) => new Date(b.latestCapturedAt).getTime() - new Date(a.latestCapturedAt).getTime())
          .slice(0, 12);

        setCompareItems(summary);
      })
      .catch(() => setCompareItems([]))
      .finally(() => setCompareLoading(false));
  }, [data?.team.id]);

  const summary = useMemo(() => {
    if (!data) {
      return {
        memberCount: 0,
        roadmapCount: 0,
        totalSteps: 0,
        topSolvedCount: 0,
      };
    }
    const totalSteps = data.roadmaps.reduce((sum, roadmap) => sum + roadmap.steps.length, 0);
    const topSolvedCount = Math.max(...data.members.map((member) => member.solvedCount), 0);
    return {
      memberCount: data.members.length,
      roadmapCount: data.roadmaps.length,
      totalSteps,
      topSolvedCount,
    };
  }, [data]);

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
      const res = await fetch("/api/integrations/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: data.team.id }),
      });
      const raw = await res.text();
      const json = raw ? JSON.parse(raw) : {};
      if (!res.ok) throw new Error(json.error || `토큰 발급 실패 (${res.status})`);
      setIntegrationToken(json.token || "");
    } catch (e) {
      setTokenError(e instanceof Error ? e.message : "토큰 발급 실패");
    } finally {
      setTokenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">그룹 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-red-500">{error || "알 수 없는 오류"}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7faff] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(15,70,216,0.14),transparent_38%),radial-gradient(circle_at_92%_100%,rgba(82,126,255,0.15),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(15,70,216,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,70,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-blue-200 bg-[radial-gradient(circle_at_0%_0%,#ffffff_0%,#f6f9ff_45%,#eff4ff_100%)] p-6 shadow-[0_30px_80px_-52px_rgba(0,70,254,0.65)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="relative space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wider text-blue-700">GROUP COMMAND CENTER</p>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white/85 px-3 py-2 backdrop-blur"
                  >
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">{data.team.name}</h1>
                    {myGroups.length > 1 && <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  {dropdownOpen && myGroups.length > 1 && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg">
                      {myGroups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            router.push(`/group/${group.id}`);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                            group.id === Number(id) ? "bg-[#F2F7FF] text-[#0F46D8] font-semibold" : "text-slate-700 hover:bg-[#F8FBFF]"
                          }`}
                        >
                          {group.name}
                          <span className="ml-2 text-xs text-slate-400">{group.role === "OWNER" ? "팀장" : "멤버"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={copyInviteCode}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white/85 px-4 py-2.5 backdrop-blur transition hover:bg-[#F4F8FF]"
              >
                <span className="font-mono text-sm font-bold tracking-widest text-[#0F46D8]">{data.team.invite_code}</span>
                {copiedInvite ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-500" />}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
                <p className="text-xs text-slate-500">팀 멤버</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Users size={16} />
                  {summary.memberCount}명
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
                <p className="text-xs text-slate-500">로드맵</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Layers3 size={16} />
                  {summary.roadmapCount}개
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
                <p className="text-xs text-slate-500">총 학습 단계</p>
                <p className="mt-1 text-xl font-bold text-[#0F46D8]">{summary.totalSteps.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white/80 p-3.5">
                <p className="text-xs text-slate-500">팀 내 최다 풀이</p>
                <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-[#0F46D8]">
                  <Trophy size={16} />
                  {summary.topSolvedCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-6 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={18} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">크롬 확장 연동</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-white/70 p-4">
              <p className="text-xs text-slate-500">Team ID (확장에 그대로 입력)</p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2.5">
                <span className="font-mono text-sm font-bold text-[#0F46D8]">{data.team.id}</span>
                <button onClick={copyTeamId} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0F46D8]">
                  {copiedTeamId ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  {copiedTeamId ? "복사됨" : "복사"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white/70 p-4">
              <p className="text-xs text-slate-500">API Token (Bearer)</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={issueToken}
                  disabled={tokenLoading}
                  className="rounded-xl bg-[#0F46D8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0A37B0] disabled:opacity-50"
                >
                  {tokenLoading ? "발급 중..." : integrationToken ? "토큰 재발급" : "토큰 발급"}
                </button>
                {integrationToken && (
                  <button onClick={copyToken} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F4F8FF]">
                    {copiedToken ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    {copiedToken ? "복사됨" : "토큰 복사"}
                  </button>
                )}
              </div>
              {integrationToken && (
                <p className="mt-2 break-all rounded-xl border border-blue-200 bg-white px-3 py-2 font-mono text-[11px] text-slate-600">
                  {integrationToken}
                </p>
              )}
              {tokenError && <p className="mt-2 text-xs text-red-500">{tokenError}</p>}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-6 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
          <div className="mb-4 flex items-center gap-2">
            <Users size={18} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">
              멤버 랭킹 <span className="text-sm font-normal text-slate-500">({data.members.length}명)</span>
            </h2>
          </div>
          <MemberRanking members={data.members} />
        </section>

        <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-6 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
          <div className="mb-4 flex items-center gap-2">
            <Code2 size={18} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">팀 코드 비교</h2>
          </div>

          {compareLoading ? (
            <p className="text-sm text-slate-500">코드 비교 목록을 불러오는 중...</p>
          ) : compareItems.length === 0 ? (
            <p className="text-sm text-slate-500">아직 팀 코드가 수집되지 않았습니다.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {compareItems.map((item) => (
                <Link
                  key={item.problemId}
                  href={`/teams/${data.team.id}/problems/${item.problemId}/compare`}
                  className="rounded-2xl border border-blue-100 bg-white/70 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-42px_rgba(0,70,254,0.55)]"
                >
                  <p className="text-sm font-semibold text-slate-800">문제 {item.problemId}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    팀원 {item.memberCount}명 · 제출 {item.submissionCount}건
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    최신 수집: {new Date(item.latestCapturedAt).toLocaleString("ko-KR")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <RoadmapSection roadmaps={data.roadmaps} progress={progress} onToggle={toggleProgress} />
      </div>
    </div>
  );
}
