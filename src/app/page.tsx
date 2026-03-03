"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { getTierColor } from "@/lib/status/solvedac";

const AlgoRadarChart = dynamic(() => import("@/components/status/RadarChart"), { ssr: false });
const RivalChart = dynamic(() => import("@/components/status/RivalChart"), { ssr: false });
import LevelHistogram from "@/components/status/LevelHistogram";
import ClassProgress from "@/components/status/ClassProgress";
import StyleCard from "@/components/status/StyleCard";

// ── 타입 정의 ──────────────────────────────────────────
type AnalyzeEvent =
  | { type: "tool_call"; tool: string; input: Record<string, string> }
  | { type: "tool_result"; tool: string }
  | { type: "result"; text: string }
  | { type: "error"; message: string };

interface StatsData {
  user: { handle: string; tier: number; tierName: string; rating: number; solvedCount: number; maxStreak: number };
  radarTags: { tag: string; name: string; solved: number; total: number; solveRate: number }[];
  weakTags: { tag: string; name: string; solved: number; total: number; tried: number; solveRate: number }[];
  levelHistogram: { label: string; solved: number; total: number; color: string; pct: number }[];
  classProgress: { class: number; total: number; totalSolved: number; essentials: number; essentialSolved: number; decoration: string | null; pct: number }[];
  nextClassInfo: { class: number; essentialLeft: number; totalLeft: number } | null;
  styleData: { easy: number; normal: number; hard: number; veryHard: number; topTags: { name: string; count: number }[]; hardestLevel: number; styleLabel: string };
  siteInfo: { totalUsers: number; totalProblems: number };
}

interface RivalData {
  me: { handle: string; tierName: string; rating: number };
  rival: { handle: string; tierName: string; rating: number };
  comparison: { tag: string; name: string; me: number; rival: number; diff: number }[];
}

const TOOL_LABEL: Record<string, string> = {
  get_user_info: "유저 정보 조회 중",
  get_tag_stats: "태그 통계 분석 중",
  search_problems: "맞춤 문제 검색 중",
};

// ── 메인 페이지 ────────────────────────────────────────
export default function Home() {
  const [handle, setHandle] = useState("");
  const [rivalHandle, setRivalHandle] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [rivalLoading, setRivalLoading] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [rivalData, setRivalData] = useState<RivalData | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [logs, setLogs] = useState<AnalyzeEvent[]>([]);
  const [result, setResult] = useState("");

  const fetchStats = async () => {
    if (!handle.trim()) return;
    setStatsLoading(true);
    setStats(null);
    setRivalData(null);
    setResult("");
    setLogs([]);
    try {
      const res = await fetch(`/api/stats?handle=${handle.trim()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (e) {
      alert(`오류: ${e}`);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRival = async () => {
    if (!rivalHandle.trim() || !handle.trim()) return;
    setRivalLoading(true);
    setRivalData(null);
    try {
      const res = await fetch(`/api/rival?handle=${handle.trim()}&rival=${rivalHandle.trim()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRivalData(data);
    } catch (e) {
      alert(`오류: ${e}`);
    } finally {
      setRivalLoading(false);
    }
  };

  const runAnalyze = async () => {
    if (!handle.trim()) return;
    setAnalyzeLoading(true);
    setLogs([]);
    setResult("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim() }),
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
      setAnalyzeLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* ── 헤더 ── */}
        <div>
          <h1 className="text-3xl font-bold text-white">알고리즘 약점 분석기</h1>
          <p className="text-gray-500 mt-1 text-sm">solved.ac 데이터 기반 · Claude AI 문제 추천</p>
        </div>

        {/* ── 검색 ── */}
        <div className="flex gap-3">
          <input
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="BOJ 핸들 입력 (예: han97901)"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !statsLoading && fetchStats()}
          />
          <button
            onClick={fetchStats}
            disabled={statsLoading || !handle.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl font-semibold transition-colors"
          >
            {statsLoading ? "조회 중..." : "통계 보기"}
          </button>
        </div>

        {stats && (
          <div className="space-y-6">

            {/* ── 유저 카드 ── */}
            <div className="bg-gray-900 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">@{stats.user.handle}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: getTierColor(stats.user.tierName) }}>
                  {stats.user.tierName}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  전체 {stats.siteInfo.totalUsers.toLocaleString()}명 중
                </p>
              </div>
              <div className="flex gap-8 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.user.rating}</p>
                  <p className="text-xs text-gray-500 mt-1">레이팅</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.user.solvedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">풀이 수</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.user.maxStreak}</p>
                  <p className="text-xs text-gray-500 mt-1">최장 스트릭</p>
                </div>
              </div>
            </div>

            {/* ── 레이더 + 취약 태그 ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-sm font-semibold text-gray-400 mb-1">태그 분포</p>
                <p className="text-xs text-gray-600 mb-4">풀이 수 상위 8개 알고리즘</p>
                <AlgoRadarChart data={stats.radarTags} />
              </div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-sm font-semibold text-gray-400 mb-1">취약 태그</p>
                <p className="text-xs text-gray-600 mb-4">100문제 이상 중 풀이율 낮은 순</p>
                <div className="space-y-3">
                  {stats.weakTags.map((t) => (
                    <div key={t.tag}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{t.name}</span>
                        <span className="text-gray-500 text-xs">
                          {t.solved}/{t.total}
                          {t.tried > 0 && <span className="text-yellow-500 ml-1">실패 {t.tried}</span>}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500/70"
                          style={{ width: `${Math.max(t.solveRate, 0.3)}%` }}
                        />
                      </div>
                      <p className="text-right text-xs text-gray-700 mt-0.5">{t.solveRate}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 난이도 히스토그램 + CLASS 달성도 ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-sm font-semibold text-gray-400 mb-1">난이도 분포</p>
                <p className="text-xs text-gray-600 mb-4">구간별 풀이 수</p>
                <LevelHistogram data={stats.levelHistogram} />
              </div>
              <div className="bg-gray-900 rounded-2xl p-6">
                <p className="text-sm font-semibold text-gray-400 mb-1">CLASS 달성도</p>
                <p className="text-xs text-gray-600 mb-4">에센셜 문제 기준</p>
                <ClassProgress data={stats.classProgress} nextClassInfo={stats.nextClassInfo} />
              </div>
            </div>

            {/* ── 풀이 스타일 진단 ── */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <p className="text-sm font-semibold text-gray-400 mb-1">풀이 스타일 진단</p>
              <p className="text-xs text-gray-600 mb-4">상위 100문제 기준 분석</p>
              <StyleCard data={stats.styleData} />
            </div>

            {/* ── 라이벌 비교 ── */}
            <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-400">라이벌 비교</p>
                <p className="text-xs text-gray-600 mt-0.5">주요 태그별 풀이 수 비교</p>
              </div>
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-sm transition-colors"
                  placeholder="비교할 상대 핸들 (예: smjun04)"
                  value={rivalHandle}
                  onChange={(e) => setRivalHandle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !rivalLoading && fetchRival()}
                />
                <button
                  onClick={fetchRival}
                  disabled={rivalLoading || !rivalHandle.trim()}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-sm font-semibold transition-colors"
                >
                  {rivalLoading ? "비교 중..." : "비교하기"}
                </button>
              </div>
              {rivalData && <RivalChart data={rivalData} />}
            </div>

            {/* ── Claude AI 분석 ── */}
            <button
              onClick={runAnalyze}
              disabled={analyzeLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 rounded-2xl font-semibold text-lg transition-all"
            >
              {analyzeLoading ? "Claude AI 분석 중..." : "✨ Claude AI로 맞춤 문제 추천받기"}
            </button>

            {logs.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-medium">진행 상황</p>
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {log.type === "tool_call" && (
                      <>
                        <span className="text-yellow-400">⚙</span>
                        <span className="text-gray-400">
                          {TOOL_LABEL[log.tool] ?? log.tool}
                          {log.tool === "search_problems" && (
                            <span className="text-gray-600 ml-1">
                              — {(log as { type: "tool_call"; tool: string; input: Record<string, string> }).input.tag}
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {log.type === "tool_result" && (
                      <>
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-600">완료</span>
                      </>
                    )}
                  </div>
                ))}
                {analyzeLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="animate-pulse">●</span>
                    <span>리포트 작성 중...</span>
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-4">AI 분석 리포트</p>
                <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans">{result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
