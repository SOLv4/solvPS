"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, PlusCircle, Users } from "lucide-react";

export default function GroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";

  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [checking, setChecking] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    fetch("/api/group")
      .then((r) => r.json())
      .then((groups) => {
        if (Array.isArray(groups) && groups.length > 0) {
          router.replace(`/group/${groups[0].id}`);
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router, isNew]);

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-500 animate-pulse">기존 그룹 정보를 확인하는 중...</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error ?? "그룹 생성에 실패했습니다.");
        return;
      }
      const data = await res.json();
      router.push(`/group/${data.id}`);
    } catch {
      setCreateError("네트워크 오류가 발생했습니다.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      const res = await fetch("/api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: joinCode.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setJoinError(data.error ?? "그룹 가입에 실패했습니다.");
        return;
      }
      const data = await res.json();
      router.push(`/group/${data.id}`);
    } catch {
      setJoinError("네트워크 오류가 발생했습니다.");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7faff] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(15,70,216,0.14),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(82,126,255,0.15),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(15,70,216,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,70,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative mx-auto max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-blue-200 bg-[radial-gradient(circle_at_0%_0%,#ffffff_0%,#f6f9ff_45%,#eff4ff_100%)] p-6 shadow-[0_30px_80px_-52px_rgba(0,70,254,0.65)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-white/80">
              <Users size={26} className="text-[#0F46D8]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">그룹 허브</h1>
            <p className="mt-2 text-sm text-slate-600">
              학습 팀을 만들거나 초대 코드로 합류해서 멤버 랭킹과 로드맵을 함께 관리하세요.
            </p>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-6 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-[#0F46D8]" />
              <h2 className="text-base font-semibold text-slate-800">새 그룹 생성</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">스터디 목적에 맞는 그룹을 만들고 즉시 초대 코드를 발급합니다.</p>

            <label className="mb-1 block text-xs font-medium text-slate-500">그룹 이름</label>
            <input
              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0F46D8] focus:ring-2 focus:ring-[#0F46D8]/15"
              placeholder="예: 알고리즘 문제풀이 스터디"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            {createError && <p className="mt-2 text-xs text-red-500">{createError}</p>}

            <button
              onClick={handleCreate}
              disabled={createLoading || !createName.trim()}
              className="mt-5 w-full rounded-xl bg-[#0F46D8] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A37B0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? "생성 중..." : "그룹 만들기"}
            </button>
          </section>

          <section className="rounded-3xl border border-blue-100/80 bg-gradient-to-b from-white/85 to-[#f8faff]/90 p-6 backdrop-blur-md shadow-[0_24px_60px_-42px_rgba(0,70,254,0.55)]">
            <div className="mb-4 flex items-center gap-2">
              <LogIn size={18} className="text-[#0F46D8]" />
              <h2 className="text-base font-semibold text-slate-800">초대 코드로 참여</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">팀장이 공유한 8자리 초대 코드를 입력해 바로 합류할 수 있습니다.</p>

            <label className="mb-1 block text-xs font-medium text-slate-500">초대 코드</label>
            <input
              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 font-mono text-sm tracking-widest uppercase outline-none transition focus:border-[#0F46D8] focus:ring-2 focus:ring-[#0F46D8]/15"
              placeholder="예: A1B2C3D4"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />

            {joinError && <p className="mt-2 text-xs text-red-500">{joinError}</p>}

            <button
              onClick={handleJoin}
              disabled={joinLoading || !joinCode.trim()}
              className="mt-5 w-full rounded-xl border border-blue-200 bg-[#F4F8FF] py-2.5 text-sm font-semibold text-[#0F46D8] transition hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joinLoading ? "가입 중..." : "그룹 가입"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
