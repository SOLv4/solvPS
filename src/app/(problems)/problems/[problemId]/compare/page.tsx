"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeftRight, ChevronLeft, GitCompare, User } from "lucide-react";
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

function splitLines(text: string) {
  return text.replace(/\r\n/g, "\n").split("\n");
}

export default function ProblemComparePage() {
  const params = useParams<{ teamId: string; problemId: string }>();
  const teamId = params?.teamId ?? "";
  const problemId = params?.problemId ?? "";

  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leftHandle, setLeftHandle] = useState("");
  const [rightHandle, setRightHandle] = useState("");

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

  const leftLines = splitLines(left?.sourceCode || "");
  const rightLines = splitLines(right?.sourceCode || "");
  const maxLines = Math.max(leftLines.length, rightLines.length);

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
              href={`/teams/${teamId}/problems`}
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

        {!loading && !error && left && right && (
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">라인 단위 빠른 비교</h3>
            </div>
            <div className="max-h-[440px] overflow-auto">
              <table className="w-full border-collapse text-xs font-mono">
                <tbody>
                  {Array.from({ length: maxLines }).map((_, i) => {
                    const l = leftLines[i] ?? "";
                    const r = rightLines[i] ?? "";
                    const same = l === r;
                    return (
                      <tr key={i} className={same ? "bg-white" : "bg-amber-50"}>
                        <td className="w-10 border-r border-gray-100 px-2 py-1.5 text-right text-gray-300 select-none">{i + 1}</td>
                        <td className="w-1/2 border-r border-gray-100 px-3 py-1.5 text-slate-700 whitespace-pre">{l || " "}</td>
                        <td className="w-1/2 px-3 py-1.5 text-slate-700 whitespace-pre">{r || " "}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
