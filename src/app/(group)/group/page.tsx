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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Users size={20} className="text-[#0F46D8]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">그룹 허브</h1>
          <p className="mt-1 text-sm text-gray-400">
            학습 팀을 만들거나 초대 코드로 합류하세요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <PlusCircle size={15} className="text-[#0F46D8]" />
              <h2 className="text-sm font-semibold text-gray-800">새 그룹 생성</h2>
            </div>
            <p className="mb-4 text-xs text-gray-400">스터디 목적에 맞는 그룹을 만들고 초대 코드를 발급합니다.</p>

            <label className="mb-1 block text-xs font-medium text-gray-500">그룹 이름</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0F46D8] focus:ring-2 focus:ring-[#0F46D8]/10"
              placeholder="예: 알고리즘 문제풀이 스터디"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            {createError && <p className="mt-2 text-xs text-red-500">{createError}</p>}

            <button
              onClick={handleCreate}
              disabled={createLoading || !createName.trim()}
              className="mt-4 w-full rounded-lg bg-[#0F46D8] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A37B0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createLoading ? "생성 중..." : "그룹 만들기"}
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <LogIn size={15} className="text-[#0F46D8]" />
              <h2 className="text-sm font-semibold text-gray-800">초대 코드로 참여</h2>
            </div>
            <p className="mb-4 text-xs text-gray-400">팀장이 공유한 8자리 초대 코드로 바로 합류합니다.</p>

            <label className="mb-1 block text-xs font-medium text-gray-500">초대 코드</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm tracking-widest uppercase outline-none transition focus:border-[#0F46D8] focus:ring-2 focus:ring-[#0F46D8]/10"
              placeholder="예: A1B2C3D4"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />

            {joinError && <p className="mt-2 text-xs text-red-500">{joinError}</p>}

            <button
              onClick={handleJoin}
              disabled={joinLoading || !joinCode.trim()}
              className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-[#0F46D8] transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joinLoading ? "가입 중..." : "그룹 가입"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
