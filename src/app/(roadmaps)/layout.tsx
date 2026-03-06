import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Sidebar from "../../components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login"); // 로그인 안 했으면 로그인 페이지로!
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar user={session.user} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
