"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Code2, Copy, KeyRound, Users } from "lucide-react";
import RoadmapSection from "@/components/group/RoadmapSection";
import WeeklyStreakBoard, { WeeklyMember } from "@/components/group/WeeklyStreakBoard";

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
    { problemId: number; latestCapturedAt: string; memberCount: number; submissionCount: number }[]
  >([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityResponse>({
    labels: [],
    members: [],
  });
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

  useEffect(() => {
    setWeeklyLoading(true);
    fetch(`/api/group/${id}/weekly-activity`, { cache: "no-store" })
      .then(async (res) => {
        const raw = await res.text();
        const json = raw ? JSON.parse(raw) : {};
        if (!res.ok) throw new Error(json.error || "주간 활동 데이터를 불러오지 못했습니다.");
        setWeeklyActivity({
          labels: Array.isArray(json.labels) ? json.labels : [],
          members: Array.isArray(json.members) ? json.members : [],
        });
      })
      .catch(() => {
        setWeeklyActivity({ labels: [], members: [] });
      })
      .finally(() => setWeeklyLoading(false));
  }, [id]);

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
    <div className="min-h-screen bg-[#F7F8FA] px-6 py-7">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* ── 페이지 헤더 (카드 없이 자연스럽게) ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-400">내 그룹</p>
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 group"
              >
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{data.team.name}</h1>
                {myGroups.length > 1 && (
                  <ChevronDown size={18} className="mt-1 text-gray-400 transition group-hover:text-gray-600" />
                )}
              </button>
              {dropdownOpen && myGroups.length > 1 && (
                <div className="absolute left-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-200/60">
                  {myGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => { router.push(`/group/${group.id}`); setDropdownOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        group.id === Number(id)
                          ? "bg-[#EEF4FF] font-semibold text-[#0F46D8]"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {group.name}
                      <span className="ml-2 text-xs text-gray-400">{group.role === "OWNER" ? "팀장" : "멤버"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <button
              onClick={copyInviteCode}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              <span className="font-mono text-xs font-bold tracking-widest text-[#0F46D8]">{data.team.invite_code}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                {copiedInvite
                  ? <Check size={13} className="text-green-500" />
                  : <Copy size={13} className="text-gray-400" />}
                {copiedInvite ? "복사됨" : "초대 코드"}
              </span>
            </button>
            <button
              onClick={() => setIntegrationOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-[#0F46D8]/20 bg-white px-3.5 py-2 text-sm font-semibold text-[#0F46D8] shadow-sm transition hover:bg-[#F7F9FF]"
            >
              <span className="inline-flex items-center gap-2">
                <KeyRound size={14} />
                크롬 확장 연동
              </span>
              <span className="text-xs">{integrationOpen ? "접기" : "열기"}</span>
            </button>
          </div>
        </div>

        {/* ── 크롬 확장 연동 (토글) ── */}
        {integrationOpen && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <KeyRound size={14} className="text-[#0F46D8]" />
              <h2 className="text-sm font-semibold text-gray-800">크롬 확장 연동</h2>
            </div>
            <span className="text-[11px] text-gray-400">Team ID와 API 토큰을 확장에 입력하세요</span>
          </div>

          <div className="grid divide-y divide-gray-50 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <div className="px-5 py-4">
              <p className="mb-2 text-xs font-medium text-gray-500">Team ID</p>
              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="font-mono text-sm font-bold text-[#0F46D8]">{data.team.id}</span>
                <button onClick={copyTeamId} className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-[#0F46D8]">
                  {copiedTeamId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copiedTeamId ? "복사됨" : "복사"}
                </button>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="mb-2 text-xs font-medium text-gray-500">API Token</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={issueToken}
                  disabled={tokenLoading}
                  className="rounded-lg bg-[#0F46D8] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0A37B0] disabled:opacity-50"
                >
                  {tokenLoading ? "발급 중..." : integrationToken ? "재발급" : "토큰 발급"}
                </button>
                {integrationToken && (
                  <button onClick={copyToken} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                    {copiedToken ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copiedToken ? "복사됨" : "복사"}
                  </button>
                )}
              </div>
              {integrationToken && (
                <p className="mt-2 break-all rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 font-mono text-[11px] text-gray-500">
                  {integrationToken}
                </p>
              )}
              {tokenError && <p className="mt-2 text-xs text-red-500">{tokenError}</p>}
            </div>
          </div>
        </div>
        )}

        {/* ── 멤버 랭킹 ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Users size={14} className="text-[#0F46D8]" />
              <h2 className="text-sm font-semibold text-gray-800">주간 스트릭 랭킹</h2>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
              {data.members.length}명
            </span>
          </div>
          <div className="p-4">
            <WeeklyStreakBoard
              labels={weeklyActivity.labels}
              members={weeklyActivity.members}
              loading={weeklyLoading}
            />
          </div>
        </div>

        {/* ── 팀 코드 비교 ── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Code2 size={14} className="text-[#0F46D8]" />
              <h2 className="text-sm font-semibold text-gray-800">팀 코드 비교</h2>
            </div>
            {compareItems.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                {compareItems.length}문제
              </span>
            )}
          </div>
          <div className="p-4">
            {compareLoading ? (
              <p className="animate-pulse text-sm text-gray-400">불러오는 중...</p>
            ) : compareItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                <Code2 size={20} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">아직 수집된 팀 코드가 없습니다.</p>
                <p className="mt-1 text-xs text-gray-300">크롬 확장으로 제출 코드를 수집해보세요.</p>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {compareItems.map((item) => (
                  <Link
                    key={item.problemId}
                    href={`/problems/${item.problemId}/compare?teamId=${data.team.id}`}
                    className="group flex items-start justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:border-[#0F46D8]/20 hover:bg-[#F7F9FF]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">문제 {item.problemId}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        팀원 {item.memberCount}명 · 제출 {item.submissionCount}건
                      </p>
                      <p className="mt-1 text-[10px] text-gray-300">
                        {new Date(item.latestCapturedAt).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <span className="mt-0.5 text-xs font-medium text-[#0F46D8] opacity-0 transition-opacity group-hover:opacity-100">
                      보기 →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <RoadmapSection roadmaps={data.roadmaps} progress={progress} onToggle={toggleProgress} />
      </div>
    </div>
  );
}
