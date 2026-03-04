"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeftRight, ChevronLeft, GitCompare, User } from "lucide-react";

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

        const handles = [...new Set(next.map((item: SubmissionItem) => item.memberHandle))];
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
    <div className="relative min-h-screen overflow-hidden bg-[#f7faff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(15,70,216,0.14),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(82,126,255,0.15),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(15,70,216,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,70,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <section className="rounded-3xl border border-blue-200 bg-[radial-gradient(circle_at_0%_0%,#ffffff_0%,#f6f9ff_45%,#eff4ff_100%)] p-6 shadow-[0_30px_80px_-52px_rgba(0,70,254,0.65)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wider text-blue-700">TEAM CODE COMPARE</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">문제 {problemId} 코드 비교</h1>
            </div>
            <Link href={`/teams/${teamId}/problems`} className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm font-semibold text-[#0F46D8] hover:bg-[#F4F8FF]">
              <ChevronLeft size={14} />
              문제 검색으로
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-5 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
          <div className="mb-3 flex items-center gap-2">
            <GitCompare size={17} className="text-[#0F46D8]" />
            <h2 className="text-base font-semibold text-slate-800">비교 대상 선택</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
            <select
              value={leftHandle}
              onChange={(e) => setLeftHandle(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm"
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
              className="rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-sm"
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
          <div className="rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">
            코드 비교 데이터를 불러오는 중...
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && handles.length < 1 && (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-[#f8fbff] py-10 text-center text-sm text-slate-500">
            아직 이 문제에 저장된 팀 코드가 없습니다.
          </div>
        )}

        {!loading && !error && handles.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-2">
            {[left, right].map((item, index) => (
              <article key={index} className="rounded-3xl border border-blue-100/90 bg-gradient-to-b from-white/80 to-[#f8faff]/85 p-4 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                    <User size={14} />
                    {item?.memberHandle || "-"}
                  </p>
                  <div className="text-xs text-slate-500">
                    {item?.language || "-"} · 제출 #{item?.submissionId || "-"}
                  </div>
                </div>
                <div className="max-h-[580px] overflow-auto rounded-xl border border-blue-100 bg-[#fbfdff] p-3">
                  <pre className="font-mono text-[12px] leading-5 text-slate-700">
                    {(item?.sourceCode || "").trim() || "// code not found"}
                  </pre>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && !error && left && right && (
          <section className="rounded-3xl border border-blue-100/90 bg-gradient-to-b from-white/80 to-[#f8faff]/85 p-4 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">라인 단위 빠른 비교</h3>
            <div className="max-h-[440px] overflow-auto rounded-xl border border-blue-100 bg-white">
              <table className="w-full border-collapse text-xs font-mono">
                <tbody>
                  {Array.from({ length: maxLines }).map((_, i) => {
                    const l = leftLines[i] ?? "";
                    const r = rightLines[i] ?? "";
                    const same = l === r;
                    return (
                      <tr key={i} className={same ? "bg-white" : "bg-amber-50/60"}>
                        <td className="w-12 border-r border-blue-100 px-2 py-1.5 text-right text-slate-400">{i + 1}</td>
                        <td className="w-1/2 border-r border-blue-100 px-2 py-1.5 text-slate-700">{l || " "}</td>
                        <td className="w-1/2 px-2 py-1.5 text-slate-700">{r || " "}</td>
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
