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
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0F46D8] border-t-transparent" />
          <p className="text-sm text-gray-400">기존 그룹 정보를 확인하는 중...</p>
        </div>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] p-6">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F46D8] shadow-lg shadow-blue-600/30">
            <Users size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">그룹 시작하기</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            새 그룹을 만들거나 초대 코드로 기존 그룹에 참여하세요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* 생성 카드 */}
          <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4FF]">
                <PlusCircle size={16} className="text-[#0F46D8]" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">그룹 만들기</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">그룹 이름</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#0F46D8]/40 focus:bg-white focus:ring-2 focus:ring-[#0F46D8]/10"
                placeholder="예) 알고리즘 스터디"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
              />
            </div>

            {createError && <p className="text-xs text-red-500">{createError}</p>}

            <button
              onClick={() => void handleCreate()}
              disabled={createLoading || !createName.trim()}
              className="mt-auto w-full rounded-xl bg-[#0F46D8] py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-[#0A3DC0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {createLoading ? "생성 중..." : "그룹 만들기"}
            </button>
          </div>

          {/* 가입 카드 */}
          <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF4FF]">
                <LogIn size={16} className="text-[#0F46D8]" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">초대 코드로 가입</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">초대 코드</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-gray-900 outline-none transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#0F46D8]/40 focus:bg-white focus:ring-2 focus:ring-[#0F46D8]/10"
                placeholder="예) A1B2C3D4"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleJoin()}
              />
            </div>

            {joinError && <p className="text-xs text-red-500">{joinError}</p>}

            <button
              onClick={() => void handleJoin()}
              disabled={joinLoading || !joinCode.trim()}
              className="mt-auto w-full rounded-xl border border-[#0F46D8]/20 bg-[#EEF4FF] py-2.5 text-sm font-semibold text-[#0F46D8] transition-all hover:bg-[#DDE9FF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {joinLoading ? "가입 중..." : "그룹 가입"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
