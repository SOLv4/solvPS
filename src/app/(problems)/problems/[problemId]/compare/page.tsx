"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeftRight, ChevronLeft, GitCompare, Loader2, Sparkles, User } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

type SubmissionItem = {
  id: number;
  teamId: number;
  userId: number;
  memberHandle: string;
  problemId: number;
  submissionId: string;
  language: string;
  sourceCode: string;
  runtimeMs: number | null;
  memoryKb: number | null;
  result: string;
  submittedAtRaw: string | null;
  capturedAt: string;
};

type CodeReviewResult = {
  summary: string;
  comparisonPoints: string[];
  leftReview: {
    strengths: string[];
    improvements: string[];
  };
  rightReview: {
    strengths: string[];
    improvements: string[];
  };
  betterChoice: {
    handle: string | null;
    reason: string;
  };
  mergedSuggestion: string;
  reviewFocus: string[];
};

function toHighlightLang(language: string): string {
  const lang = language.toLowerCase();
  if (lang.includes("c++") || lang.includes("cpp")) return "cpp";
  if (lang.includes("python") || lang.includes("pypy")) return "python";
  if (lang.includes("java") && !lang.includes("javascript")) return "java";
  if (lang.includes("javascript") || lang.includes("js")) return "javascript";
  if (lang.includes("typescript") || lang.includes("ts")) return "typescript";
  if (lang.includes("kotlin")) return "kotlin";
  if (lang.includes("rust")) return "rust";
  if (lang.includes("go")) return "go";
  if (lang.includes("swift")) return "swift";
  if (lang.includes("ruby")) return "ruby";
  if (lang.includes("c#") || lang.includes("csharp")) return "csharp";
  if (lang.includes("php")) return "php";
  if (lang === "c") return "c";
  return "text";
}

export default function ProblemComparePage() {
  const params = useParams<{ problemId: string }>();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") ?? "";
  const problemId = params?.problemId ?? "";

  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leftHandle, setLeftHandle] = useState("");
  const [rightHandle, setRightHandle] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ teamId, problemId });
        const res = await fetch(`/api/integrations/boj/submissions?${params.toString()}`, {
          cache: "no-store",
        });
        const raw = await res.text();
        const json = raw ? JSON.parse(raw) : {};
        if (!res.ok) throw new Error(json.error || "코드 비교 데이터를 가져오지 못했습니다.");

        const next = Array.isArray(json.items) ? json.items : [];
        setItems(next);

        const handles: string[] = [...new Set<string>(next.map((item: SubmissionItem) => item.memberHandle))];
        setLeftHandle(handles[0] || "");
        setRightHandle(handles[1] || handles[0] || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "코드 비교 데이터를 가져오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    if (teamId && problemId) {
      void run();
    }
  }, [teamId, problemId]);

  const latestByHandle = useMemo(() => {
    const map = new Map<string, SubmissionItem>();
    for (const item of items) {
      if (!map.has(item.memberHandle)) {
        map.set(item.memberHandle, item);
      }
    }
    return map;
  }, [items]);

  const handles = useMemo(() => [...latestByHandle.keys()], [latestByHandle]);
  const left = leftHandle ? latestByHandle.get(leftHandle) ?? null : null;
  const right = rightHandle ? latestByHandle.get(rightHandle) ?? null : null;

  useEffect(() => {
    setReviewError("");
    setReviewResult(null);
  }, [leftHandle, rightHandle, teamId, problemId]);

  const canReview =
    Boolean(left?.id) &&
    Boolean(right?.id) &&
    left?.id !== right?.id &&
    left?.memberHandle !== right?.memberHandle;

  const runCodeReview = async () => {
    if (!left || !right) return;
    setReviewLoading(true);
    setReviewError("");
    setReviewResult(null);

    try {
      const res = await fetch("/api/problems/compare/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: Number(teamId),
          problemId: Number(problemId),
          leftSubmissionPk: left.id,
          rightSubmissionPk: right.id,
        }),
      });

      const raw = await res.text();
      const json = raw ? JSON.parse(raw) : {};
      if (!res.ok) {
        throw new Error(json.error || "Claude 코드 비교 분석에 실패했습니다.");
      }
      setReviewResult(json.result as CodeReviewResult);
    } catch (e) {
      setReviewError(
        e instanceof Error ? e.message : "Claude 코드 비교 분석 중 오류가 발생했습니다.",
      );
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">코드 비교</p>
              <h1 className="text-2xl font-bold text-gray-900">문제 {problemId} 코드 비교</h1>
            </div>
            <Link
              href="/problems"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#0F46D8] hover:bg-gray-50"
            >
              <ChevronLeft size={14} />
              문제 검색으로
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <GitCompare size={17} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">비교 대상 선택</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <select
              value={leftHandle}
              onChange={(e) => setLeftHandle(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {handles.map((handle) => (
                <option key={handle} value={handle}>
                  {handle}
                </option>
              ))}
            </select>
            <div className="grid place-items-center text-slate-400">
              <ArrowLeftRight size={18} />
            </div>
            <select
              value={rightHandle}
              onChange={(e) => setRightHandle(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {handles.map((handle) => (
                <option key={handle} value={handle}>
                  {handle}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            코드 비교 데이터를 불러오는 중...
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && handles.length < 1 && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
            아직 이 문제에 저장된 팀 코드가 없습니다.
          </div>
        )}

        {!loading && !error && handles.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-2">
            {([left, right] as (SubmissionItem | null)[]).map((item, index) => (
              <article key={index} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <User size={14} className="text-gray-400" />
                    {item?.memberHandle || "-"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono font-medium text-gray-600">
                      {item?.language || "-"}
                    </span>
                    <span>제출 #{item?.submissionId || "-"}</span>
                  </div>
                </div>
                <div className="max-h-[580px] overflow-auto">
                  <SyntaxHighlighter
                    language={toHighlightLang(item?.language || "")}
                    style={oneLight}
                    showLineNumbers
                    lineNumberStyle={{ color: "#94a3b8", fontSize: "11px", minWidth: "2.5em" }}
                    customStyle={{ margin: 0, borderRadius: "0 0 1rem 1rem", fontSize: "12px", background: "#fafafa" }}
                    codeTagProps={{ style: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } }}
                  >
                    {(item?.sourceCode || "").trim() || "// code not found"}
                  </SyntaxHighlighter>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && !error && handles.length > 0 && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <button
              onClick={() => void runCodeReview()}
              disabled={!canReview || reviewLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F46D8]/25 bg-[#F4F8FF] px-4 py-3 text-sm font-semibold text-[#0F46D8] transition-colors hover:bg-[#EAF2FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reviewLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI 코드 분석 중...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI 코드 비교&분석
                </>
              )}
            </button>
            {!canReview && handles.length > 1 && (
              <p className="mt-2 text-center text-[11px] text-amber-600">
                서로 다른 두 멤버를 선택해야 분석할 수 있습니다.
              </p>
            )}
            {reviewError && (
              <p className="mt-2 text-center text-xs text-red-500">{reviewError}</p>
            )}
          </section>
        )}

        {reviewResult && (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#0F46D8]" />
              <h3 className="text-sm font-semibold text-slate-800">AI 코드 비교 결과</h3>
            </div>
            <p className="mb-4 rounded-xl border border-blue-100 bg-[#F8FBFF] px-3 py-2 text-sm text-slate-700">
              {reviewResult.summary}
            </p>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">{left?.memberHandle} 리뷰</p>
                <p className="mb-1 text-[11px] font-semibold text-blue-700">장점</p>
                <ul className="mb-3 space-y-1 text-xs text-slate-600">
                  {reviewResult.leftReview.strengths.map((line, index) => (
                    <li key={`left-strength-${index}`}>• {line}</li>
                  ))}
                </ul>
                <p className="mb-1 text-[11px] font-semibold text-amber-700">개선점</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {reviewResult.leftReview.improvements.map((line, index) => (
                    <li key={`left-improve-${index}`}>• {line}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-100 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-700">{right?.memberHandle} 리뷰</p>
                <p className="mb-1 text-[11px] font-semibold text-blue-700">장점</p>
                <ul className="mb-3 space-y-1 text-xs text-slate-600">
                  {reviewResult.rightReview.strengths.map((line, index) => (
                    <li key={`right-strength-${index}`}>• {line}</li>
                  ))}
                </ul>
                <p className="mb-1 text-[11px] font-semibold text-amber-700">개선점</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {reviewResult.rightReview.improvements.map((line, index) => (
                    <li key={`right-improve-${index}`}>• {line}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">핵심 비교 포인트</p>
              <ul className="space-y-1 text-xs text-slate-600">
                {reviewResult.comparisonPoints.map((line, index) => (
                  <li key={`point-${index}`}>• {line}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4 rounded-xl border border-slate-100 p-3">
              <p className="mb-1 text-xs font-semibold text-slate-700">현재 기준 더 나은 선택</p>
              <p className="text-sm font-semibold text-[#0F46D8]">
                {reviewResult.betterChoice.handle ?? "동등"}
              </p>
              <p className="mt-1 text-xs text-slate-600">{reviewResult.betterChoice.reason}</p>
            </div>

            <div className="mb-4 rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">리뷰 기준</p>
              <div className="flex flex-wrap gap-1.5">
                {reviewResult.reviewFocus.map((focus, index) => (
                  <span
                    key={`focus-${index}`}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                  >
                    {focus}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-[#F8FBFF] p-3">
              <p className="mb-1 text-xs font-semibold text-slate-700">통합 개선 가이드</p>
              <p className="text-xs leading-relaxed text-slate-700">{reviewResult.mergedSuggestion}</p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
