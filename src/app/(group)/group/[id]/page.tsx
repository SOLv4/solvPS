"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, Layers3, Trophy, Users } from "lucide-react";
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

export default function GroupDashboard() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
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
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-500" />}
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
            <Users size={18} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">
              멤버 랭킹 <span className="text-sm font-normal text-slate-500">({data.members.length}명)</span>
            </h2>
          </div>
          <MemberRanking members={data.members} />
        </section>

        <RoadmapSection roadmaps={data.roadmaps} />
      </div>
    </div>
  );
}
