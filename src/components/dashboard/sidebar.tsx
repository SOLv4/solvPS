"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import {
  BarChart2,
  BookOpen,
  LogOut,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";

export default function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  const menuItems = [
    { name: "내 통계", href: "/status", icon: BarChart2 },
    { name: "내 그룹", href: "/group", icon: Users },
    { name: "로드맵", href: "/roadmaps", icon: BookOpen },
    { name: "문제 검색", href: "/problems", icon: Search },
  ];

  const initials = user.name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col bg-[#0B1120]">
      {/* 로고 */}
      <div className="flex h-16 items-center border-b border-white/[0.06] px-5">
        <Link href="/dashboard" className="flex items-center gap-1">
          <span className="text-xl font-black tracking-tight text-white">Solv</span>
          <span className="text-xl font-black tracking-tight text-[#4F8EFF]">PS</span>
        </Link>
      </div>

      {/* 유저 프로필 */}
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-[#0B1120] flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#4F8EFF] to-[#0F46D8] opacity-70 -z-10" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.name ?? "-"}
            </p>
            <p className="truncate text-xs text-white/40">
              {user.email ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-white/25">
          메뉴
        </p>
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#0F46D8]/15 text-[#6BA3FF]"
                      : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
                  }`}
                >
                  <item.icon
                    size={15}
                    className={
                      isActive
                        ? "text-[#6BA3FF]"
                        : "text-white/30 group-hover:text-white/60"
                    }
                  />
                  {item.name}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#4F8EFF]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-white/25">
            그룹
          </p>
          <Link
            href="/group?new=1"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/45 transition-all hover:bg-white/[0.05] hover:text-white/80"
          >
            <PlusCircle size={15} className="text-white/30" />
            새 그룹 생성
          </Link>
        </div>
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/30 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
