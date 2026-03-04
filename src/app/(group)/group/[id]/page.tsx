"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Check, Users } from "lucide-react";
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

export default function GroupDashboard() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  const copyInviteCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.team.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#666] text-sm animate-pulse">불러오는 중...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-500 text-sm">{error || "알 수 없는 오류"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 pb-6 border-b border-[#EAEAEA]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111]">{data.team.name}</h1>
              <p className="text-[#666] text-sm mt-1">그룹 대시보드</p>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-4 py-2 bg-[#F5F8FF] hover:bg-[#E6EEFF] border border-[#EAEAEA] rounded-xl transition-colors"
            >
              <span className="font-mono text-sm font-semibold text-[#0046FE] tracking-widest">
                {data.team.invite_code}
              </span>
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-[#666]" />
              )}
            </button>
          </div>
        </div>

        {/* 멤버 랭킹 */}
        <div className="border border-[#EAEAEA] rounded-2xl p-6 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#0046FE]" />
            <h2 className="text-base font-semibold text-[#111]">
              멤버 랭킹
              <span className="ml-2 text-sm font-normal text-[#666]">({data.members.length}명)</span>
            </h2>
          </div>
          <MemberRanking members={data.members} />
        </div>

        <RoadmapSection roadmaps={data.roadmaps} />
      </div>
    </div>
  );
}
