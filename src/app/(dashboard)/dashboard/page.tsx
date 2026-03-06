"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, PlusCircle, LogIn } from "lucide-react";

export default function GroupPage() {
  const router = useRouter();

  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [checking, setChecking] = useState(true);

  useEffect(() => {
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
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#666] text-sm animate-pulse">불러오는 중....</p>
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F5F8FF] mb-4">
            <Users size={28} className="text-[#0046FE]" />
          </div>
          <h1 className="text-2xl font-bold text-[#111]">그룹</h1>
          <p className="text-[#666] text-sm mt-1">
            그룹을 만들거나 초대 코드로 가입하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 생성 카드 */}
          <div className="border border-[#EAEAEA] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <PlusCircle size={18} className="text-[#0046FE]" />
              <h2 className="text-base font-semibold text-[#111]">
                그룹 만들기
              </h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#666]">
                그룹 이름
              </label>
              <input
                className="w-full px-3 py-2.5 text-sm border border-[#EAEAEA] rounded-lg outline-none focus:border-[#0046FE] focus:ring-2 focus:ring-[#0046FE]/10 transition-colors"
                placeholder="ex) 알고리즘 스터디"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>

            {createError && (
              <p className="text-red-500 text-xs">{createError}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={createLoading || !createName.trim()}
              className="mt-auto w-full py-2.5 text-sm font-semibold bg-[#0046FE] hover:bg-[#0036CC] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {createLoading ? "생성 중..." : "그룹 만들기"}
            </button>
          </div>

          {/* 가입 카드 */}
          <div className="border border-[#EAEAEA] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2">
              <LogIn size={18} className="text-[#2E67FE]" />
              <h2 className="text-base font-semibold text-[#111]">
                초대 코드로 가입
              </h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#666]">
                초대 코드
              </label>
              <input
                className="w-full px-3 py-2.5 text-sm border border-[#EAEAEA] rounded-lg outline-none focus:border-[#2E67FE] focus:ring-2 focus:ring-[#2E67FE]/10 transition-colors tracking-widest uppercase font-mono"
                placeholder="ex) A1B2C3D4"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            {joinError && <p className="text-red-500 text-xs">{joinError}</p>}

            <button
              onClick={handleJoin}
              disabled={joinLoading || !joinCode.trim()}
              className="mt-auto w-full py-2.5 text-sm font-semibold bg-[#F5F8FF] hover:bg-[#E6EEFF] disabled:opacity-40 disabled:cursor-not-allowed text-[#0046FE] rounded-lg transition-colors"
            >
              {joinLoading ? "가입 중..." : "그룹 가입"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
