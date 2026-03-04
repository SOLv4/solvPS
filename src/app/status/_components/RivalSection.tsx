"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RivalData } from "@/lib/status/types";

const RivalChart = dynamic(() => import("@/components/status/RivalChart"), { ssr: false });

export default function RivalSection({ myHandle }: { myHandle: string }) {
  const [rivalHandle, setRivalHandle] = useState("");
  const [rivalData, setRivalData] = useState<RivalData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRival = async () => {
    if (!rivalHandle.trim()) return;
    setLoading(true);
    setRivalData(null);
    try {
      const res = await fetch(
        `/api/status/rival?handle=${myHandle}&rival=${rivalHandle.trim()}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRivalData(data);
    } catch (e) {
      alert(`오류: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-100/80 bg-gradient-to-b from-white to-[#f8faff] shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700">라이벌 비교</CardTitle>
        <CardDescription className="text-xs">주요 태그별 풀이 수 비교</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Input
            className="border-blue-200 bg-white/90 focus-visible:ring-[#0046FE] placeholder:text-slate-400 text-sm"
            placeholder="비교할 상대 핸들 입력"
            value={rivalHandle}
            onChange={(e) => setRivalHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && fetchRival()}
          />
          <Button
            onClick={fetchRival}
            disabled={loading || !rivalHandle.trim()}
            variant="outline"
            className="shrink-0 border-[#0046FE] text-[#0046FE] hover:bg-[#0046FE] hover:text-white"
          >
            {loading ? "비교 중..." : "비교하기"}
          </Button>
        </div>
        {rivalData && <RivalChart data={rivalData} />}
      </CardContent>
    </Card>
  );
}
