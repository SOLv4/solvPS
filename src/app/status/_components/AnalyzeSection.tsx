"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyzeEvent =
  | { type: "tool_call"; tool: string; input: Record<string, string> }
  | { type: "tool_result"; tool: string }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

const TOOL_LABEL: Record<string, string> = {
  get_user_info: "유저 정보 조회 중",
  get_tag_stats: "태그 통계 분석 중",
  search_problems: "맞춤 문제 검색 중",
};

export default function AnalyzeSection({ handle }: { handle: string }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AnalyzeEvent[]>([]);
  const [result, setResult] = useState("");

  const runAnalyze = async () => {
    setLoading(true);
    setLogs([]);
    setResult("");
    try {
      const res = await fetch("/api/status/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const event: AnalyzeEvent = JSON.parse(line.slice(6));
          if (event.type === "result") setResult(event.text);
          else setLogs((prev) => [...prev, event]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runAnalyze}
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-[#0046FE] to-[#2E67FE] py-6 text-base font-semibold text-white shadow-[0_20px_40px_-22px_rgba(0,70,254,0.95)] hover:opacity-95"
      >
        {loading ? "Claude AI 분석 중..." : "✦ Claude AI로 맞춤 문제 추천받기"}
      </Button>

      {logs.length > 0 && (
        <Card className="border-blue-100/80 bg-gradient-to-b from-white to-[#f8faff]">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">진행 상황</p>
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {log.type === "tool_call" && (
                  <>
                    <span className="text-[#2E67FE]">⚙</span>
                    <span className="text-gray-500">
                      {TOOL_LABEL[log.tool] ?? log.tool}
                      {log.tool === "search_problems" && (
                        <span className="text-gray-300 ml-1">
                          — {(log as { type: "tool_call"; tool: string; input: Record<string, string> }).input.tag}
                        </span>
                      )}
                    </span>
                  </>
                )}
                {log.type === "tool_result" && (
                  <>
                    <span className="text-[#0046FE]">✓</span>
                    <span className="text-gray-400">완료</span>
                  </>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="animate-pulse text-[#0046FE]">●</span>
                <span>리포트 작성 중...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-blue-100/80 bg-gradient-to-b from-white to-[#f8faff] shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#0046FE] flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">AI</span>
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">AI 분석 리포트</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{result}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
