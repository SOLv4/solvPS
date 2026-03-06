"use client";

import { useState, useRef, useEffect } from "react";
import { BookmarkPlus, Check, ChevronDown, Loader2 } from "lucide-react";

type Roadmap = {
  id: number;
  title: string;
  teamId: number | null;
  teamName: string | null;
};

type Props = {
  bojId: number;
  title: string;
  level: number;
};

export default function AddToRoadmapButton({ bojId, title, level }: Props) {
  const [open, setOpen] = useState(false);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchRoadmaps = async () => {
    if (roadmaps.length > 0) { setOpen(true); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/roadmaps");
      const data = await res.json();
      const items: Roadmap[] = (data.items ?? []).filter((r: Roadmap) => r.teamId !== null);
      setRoadmaps(items);
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };

  const handleAdd = async (roadmap: Roadmap) => {
    if (!roadmap.teamId || saving !== null) return;
    setSaving(roadmap.id);
    try {
      const res = await fetch(`/api/group/${roadmap.teamId}/roadmap-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bojId, title, level, roadmapId: roadmap.id }),
      });
      if (res.ok) {
        setSaved((prev) => [...prev, roadmap.id]);
        setTimeout(() => setOpen(false), 800);
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={fetchRoadmaps}
        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#0046FE]/20 bg-[#F5F8FF] text-[#0046FE] hover:bg-[#EEF4FF] hover:border-[#0046FE]/40 transition-all"
      >
        {loading
          ? <Loader2 size={11} className="animate-spin" />
          : <BookmarkPlus size={11} />}
        로드맵
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
          {roadmaps.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">
              그룹 로드맵이 없습니다.<br />
              <span className="text-[#0046FE]">그룹을 만들어 로드맵을 추가하세요.</span>
            </div>
          ) : (
            <ul className="py-1">
              {roadmaps.map((r) => {
                const isSaved = saved.includes(r.id);
                const isSaving = saving === r.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => handleAdd(r)}
                      disabled={isSaved || isSaving}
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-gray-50 transition-colors ${isSaved ? "opacity-60" : ""}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isSaving
                          ? <Loader2 size={12} className="animate-spin text-[#0046FE]" />
                          : isSaved
                          ? <Check size={12} className="text-green-500" />
                          : <BookmarkPlus size={12} className="text-gray-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{r.title}</p>
                        {r.teamName && (
                          <p className="text-[10px] text-gray-400 truncate">{r.teamName}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
