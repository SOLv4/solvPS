"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyzeEvent =
  | { type: "tool_call"; tool: string; input: Record<string, string> }
  | { type: "tool_result"; tool: string; summary?: string }
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
  const [error, setError] = useState("");

  const runAnalyze = async () => {
    setLoading(true);
    setLogs([]);
    setResult("");
    setError("");
    try {
      const res = await fetch("/api/status/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      if (!res.ok || !res.body) {
        const message = await res.text().catch(() => "");
        throw new Error(message || `분석 요청 실패 (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processBlock = (block: string) => {
        const dataLine = block
          .split("\n")
          .find((line) => line.startsWith("data: "));
        if (!dataLine) return;
        try {
          const event: AnalyzeEvent = JSON.parse(dataLine.slice(6));
          if (event.type === "result") {
            setResult(event.text);
            return;
          }
          if (event.type === "error") {
            setError(event.message);
            return;
          }
          setLogs((prev) => [...prev, event]);
        } catch {
          setError("분석 응답 파싱에 실패했습니다.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let splitIndex = buffer.indexOf("\n\n");
        while (splitIndex !== -1) {
          const block = buffer.slice(0, splitIndex);
          buffer = buffer.slice(splitIndex + 2);
          processBlock(block);
          splitIndex = buffer.indexOf("\n\n");
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) processBlock(buffer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={runAnalyze}
        disabled={loading}
        className="w-full rounded-2xl bg-[#0F46D8] py-6 text-base font-semibold text-white hover:bg-[#0A37B0]"
      >
        {loading ? "Claude AI 분석 중..." : "✦ Claude AI로 맞춤 문제 추천받기"}
      </Button>

      {logs.length > 0 && (
        <Card className="border-gray-100 bg-white">
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
                    <span className="text-gray-400">
                      완료{log.summary ? ` · ${log.summary}` : ""}
                    </span>
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

      {error && (
        <Card className="border-red-100 bg-red-50/50 shadow-sm">
          <CardContent className="p-4 flex items-start gap-2">
            <span className="text-red-400 mt-0.5">⚠</span>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-gray-100 bg-white shadow-sm">
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
