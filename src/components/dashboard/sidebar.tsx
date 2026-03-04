"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { User, Users, LogOut, PlusCircle, BarChart2 } from "lucide-react";

export default function Sidebar({ user }: { user: any }) {
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
    { name: "로드맵", href: "/team/roadmaps", icon: BarChart2 },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-[#EAEAEA] flex flex-col">
      {/* 로고 영역 */}
      <div className="p-6">
        <Link
          href="/dashboard"
          className="text-[#0046FE] font-bold text-xl tracking-tight"
        >
          ROADMAP
        </Link>
      </div>

      {/* 사용자 프로필 요약 */}
      <div className="px-6 py-4 mb-4">
        <div className="flex items-center gap-3 p-3 bg-[#F5F8FF] rounded-xl">
          <div className="w-10 h-10 rounded-full bg-[#2E67FE] flex items-center justify-center text-white">
            <User size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-[#111] truncate">
              {user.name}
            </p>
            <p className="text-xs text-[#666] truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0046FE] text-white"
                  : "text-[#666] hover:bg-[#F5F8FF] hover:text-[#0046FE]"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
        {/* 구분선과 그룹 생성 버튼 */}
        <div className="pt-4 mt-4 border-t border-[#EAEAEA]">
          <Link
            href="/group?new=1"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-[#F5F8FF] text-[#0046FE] hover:bg-[#E6EEFF] transition-colors"
          >
            <PlusCircle size={18} />새 그룹 생성
          </Link>
        </div>
      </nav>

      {/* 하단 로그아웃 */}
      <div className="p-4 border-t border-[#EAEAEA]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#FF4D4F] hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
