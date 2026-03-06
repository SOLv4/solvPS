"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import AddToRoadmapButton from "./AddToRoadmapButton";

type Problem = { id: number; title: string; tier: string; reason: string };
type WeakTag = {
  key: string;
  name: string;
  solved: number;
  total: number;
  reason: string;
  approach: string;
  problems: Problem[];
};
type RoadmapStep = {
  phase: number;
  title: string;
  duration: string;
  description: string;
  tags: string[];
};
type AnalyzeResult = {
  summary: string;
  weakTags: WeakTag[];
  roadmap: RoadmapStep[];
};

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

const TIER_COLOR: Record<string, string> = {
  B: "#ad5600", S: "#435f7a", G: "#ec9a00",
  P: "#27e2a4", D: "#00b4fc", R: "#ff0062",
};
function tierColor(tier: string) {
  return TIER_COLOR[tier?.[0]?.toUpperCase()] ?? "#6b7280";
}

function tierToLevel(tier: string): number {
  const base: Record<string, number> = { B: 1, S: 6, G: 11, P: 16, D: 21, R: 26 };
  const letter = tier?.[0]?.toUpperCase() ?? "";
  const num = parseInt(tier?.slice(1) ?? "5", 10);
  const b = base[letter];
  if (!b) return 0;
  return b + (5 - (isNaN(num) ? 5 : num));
}

function ProblemRow({ problem }: { problem: Problem }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:border-[#0046FE]/20 hover:bg-[#F8FAFF] transition-colors group">
      <span
        className="shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
        style={{ color: tierColor(problem.tier), backgroundColor: `${tierColor(problem.tier)}18` }}
      >
        {problem.tier}
      </span>
      <a
        href={`https://www.acmicpc.net/problem/${problem.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-gray-800 group-hover:text-[#0046FE] transition-colors truncate">
            {problem.id}번. {problem.title}
          </span>
          <ExternalLink size={11} className="shrink-0 text-gray-300 group-hover:text-[#0046FE]" />
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{problem.reason}</p>
      </a>
      <AddToRoadmapButton bojId={problem.id} title={problem.title} level={tierToLevel(problem.tier)} />
    </div>
  );
}

function WeakTagCard({ tag }: { tag: WeakTag }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden transition-shadow hover:shadow-sm">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge className="shrink-0 bg-[#EEF4FF] text-[#0F46D8] border-0 text-xs font-semibold">
            {tag.name}
          </Badge>
          <span className="text-xs text-gray-400 truncate">{tag.solved}문제 풀이</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-gray-300 hidden sm:block">{tag.problems.length}개 추천</span>
          {open
            ? <ChevronUp size={14} className="text-gray-300" />
            : <ChevronDown size={14} className="text-gray-300" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-50">
          <div className="px-5 py-4 grid sm:grid-cols-2 gap-4 bg-gray-50/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">보완 포인트</p>
              <p className="text-xs text-gray-600 leading-relaxed">{tag.reason}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">접근 방법</p>
              <p className="text-xs text-gray-600 leading-relaxed">{tag.approach}</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">추천 문제</p>
            {tag.problems.map((p) => <ProblemRow key={p.id} problem={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

const PHASE_COLORS = [
  { bg: "#EEF4FF", text: "#0F46D8", border: "#0046FE20" },
  { bg: "#F0FDF4", text: "#16a34a", border: "#16a34a20" },
  { bg: "#FFF7ED", text: "#ea580c", border: "#ea580c20" },
  { bg: "#FDF4FF", text: "#9333ea", border: "#9333ea20" },
  { bg: "#FFF1F2", text: "#e11d48", border: "#e11d4820" },
];

function Roadmap({ steps }: { steps: RoadmapStep[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {steps.map((step, i) => {
        const colors = PHASE_COLORS[i % PHASE_COLORS.length];
        return (
          <div key={step.phase} className="flex items-center shrink-0">
            <div
              className="w-48 rounded-2xl border p-4 flex flex-col gap-2.5 h-full"
              style={{ borderColor: colors.border, backgroundColor: colors.bg + "80" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: colors.text, backgroundColor: colors.bg }}
                >
                  Phase {step.phase}
                </span>
                <span className="text-[10px] text-gray-400">{step.duration}</span>
              </div>
              <p className="text-xs font-bold text-gray-800 leading-snug">{step.title}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed flex-1">{step.description}</p>
              <div className="flex flex-wrap gap-1 mt-auto">
                {step.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded border"
                    style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {i < steps.length - 1 && (
              <span className="px-1.5 text-gray-200 text-base font-light">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyzeSection({ handle }: { handle: string }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AnalyzeEvent[]>([]);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState("");

  const runAnalyze = async () => {
    setLoading(true);
    setLogs([]);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/status/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      if (!res.ok || !res.body) throw new Error(`분석 요청 실패 (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const processBlock = (block: string) => {
        const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
        if (!dataLine) return;
        try {
          const event: AnalyzeEvent = JSON.parse(dataLine.slice(6));
          if (event.type === "result") {
            try {
              const jsonMatch = event.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
              const raw = (jsonMatch ? jsonMatch[1] : event.text).trim();
              setResult(JSON.parse(raw) as AnalyzeResult);
            } catch {
              setError("분석 결과 파싱에 실패했습니다.");
            }
            return;
          }
          if (event.type === "error") { setError(event.message); return; }
          setLogs((prev) => [...prev, event]);
        } catch {
          setError("응답 파싱에 실패했습니다.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx = buffer.indexOf("\n\n");
        while (idx !== -1) {
          processBlock(buffer.slice(0, idx));
          buffer = buffer.slice(idx + 2);
          idx = buffer.indexOf("\n\n");
        }
      }
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

      {logs.length > 0 && !result && (
        <Card className="border-gray-100 bg-white">
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">진행 상황</p>
            {logs.map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {log.type === "tool_call" && (
                  <>
                    <span className="text-[#2E67FE] text-xs">⚙</span>
                    <span className="text-gray-500 text-xs">
                      {TOOL_LABEL[log.tool] ?? log.tool}
                      {log.tool === "search_problems" && (
                        <span className="text-gray-300 ml-1">— {(log as { type: "tool_call"; tool: string; input: Record<string, string> }).input.tag}</span>
                      )}
                    </span>
                  </>
                )}
                {log.type === "tool_result" && (
                  <>
                    <span className="text-green-500 text-xs">✓</span>
                    <span className="text-gray-400 text-xs">완료{log.summary ? ` · ${log.summary}` : ""}</span>
                  </>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <span className="animate-pulse text-[#0046FE] text-xs">●</span>
                <span className="text-gray-400 text-xs">리포트 작성 중...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4 flex items-start gap-2">
            <span className="text-red-400 mt-0.5 text-sm">⚠</span>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-gradient-to-r from-[#EEF4FF] to-[#F5F8FF] border border-[#0046FE]/10 px-5 py-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-[#0046FE] flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-[10px] font-black">AI</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#0046FE]/60 mb-1">AI 진단 요약</p>
              <p className="text-sm font-semibold text-[#0F46D8] leading-relaxed">{result.summary}</p>
            </div>
          </div>

          <Card className="border-gray-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">취약 태그 분석</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.weakTags.map((tag) => <WeakTagCard key={tag.key} tag={tag} />)}
            </CardContent>
          </Card>

          {result.roadmap?.length > 0 && (
            <Card className="border-gray-100 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">학습 로드맵</CardTitle>
              </CardHeader>
              <CardContent>
                <Roadmap steps={result.roadmap} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
