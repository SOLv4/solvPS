"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import {
  BarChart2,
  BookOpen,
  ChevronRight,
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
    <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-gray-100 bg-white">
      {/* 로고 */}
      <div className="flex h-14 items-center border-b border-gray-100 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F46D8]">
            <span className="text-[11px] font-black text-white">S</span>
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            SolvPS
          </span>
        </Link>
      </div>

      {/* 유저 프로필 */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F46D8] text-[11px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-800">
              {user.name ?? "-"}
            </p>
            <p className="truncate text-[10px] text-gray-400">
              {user.email ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          메뉴
        </p>
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#EEF4FF] text-[#0F46D8]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                >
                  <item.icon
                    size={15}
                    className={
                      isActive
                        ? "text-[#0F46D8]"
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  />
                  {item.name}
                  {isActive && (
                    <ChevronRight
                      size={12}
                      className="ml-auto text-[#0F46D8]/50"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            그룹
          </p>
          <Link
            href="/group?new=1"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <PlusCircle size={15} className="text-gray-400" />새 그룹 생성
          </Link>
        </div>
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-gray-100 px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
