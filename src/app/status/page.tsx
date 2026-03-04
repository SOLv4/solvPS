import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getStatusStats } from "@/lib/status/service";
import { getTierColor } from "@/lib/status/solvedac";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import LevelHistogram from "@/components/status/LevelHistogram";
import ClassProgress from "@/components/status/ClassProgress";
import StyleCard from "@/components/status/StyleCard";
import RivalSection from "./_components/RivalSection";
import AnalyzeSection from "./_components/AnalyzeSection";
import AlgoRadarChart from "./_components/RadarChartClient";

export default async function StatusPage() {
  const user = await getSessionUser();

  // 비로그인 시 로그인 페이지로 이동
  // TODO: 친구가 만들 로그인 페이지 경로로 교체
  if (!user) redirect("/login");

  // BOJ 핸들 미등록 시 등록 페이지로
  if (!user.boj?.bojHandle) redirect("/register/boj");

  const stats = await getStatusStats(user.boj.bojHandle);

  return (
    <main className="min-h-screen bg-white">
      {/* ── 헤더 ── */}
      <header className="border-b border-blue-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0046FE] flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">solvPS</span>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">solved.ac 기반 · Claude AI 분석</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* ── 유저 카드 ── */}
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">@{stats.user.handle}</p>
                <p className="text-3xl font-bold" style={{ color: getTierColor(stats.user.tierName) }}>
                  {stats.user.tierName}
                </p>
                <p className="text-xs text-gray-400">
                  전체 {stats.siteInfo.totalUsers.toLocaleString()}명 중
                </p>
              </div>
              <div className="flex gap-8 text-center">
                {[
                  { value: stats.user.rating,     label: "레이팅" },
                  { value: stats.user.solvedCount, label: "풀이 수" },
                  { value: stats.user.maxStreak,   label: "최장 스트릭" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-[#0046FE]">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 레이더 + 취약 태그 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">태그 분포</CardTitle>
              <CardDescription className="text-xs">풀이 수 상위 8개 알고리즘</CardDescription>
            </CardHeader>
            <CardContent>
              <AlgoRadarChart data={stats.radarTags} />
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">취약 태그</CardTitle>
              <CardDescription className="text-xs">100문제 이상 중 풀이율 낮은 순</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weakTags.map((t) => (
                  <div key={t.tag}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{t.name}</span>
                      <span className="text-gray-400 text-xs">
                        {t.solved}/{t.total}
                        {t.tried > 0 && (
                          <span className="text-[#2E67FE] ml-1.5">실패 {t.tried}</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0046FE]"
                        style={{ width: `${Math.max(t.solveRate, 0.5)}%`, opacity: 0.7 }}
                      />
                    </div>
                    <p className="text-right text-xs text-gray-300 mt-0.5">{t.solveRate}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 난이도 히스토그램 + CLASS 달성도 ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">난이도 분포</CardTitle>
              <CardDescription className="text-xs">구간별 풀이 수</CardDescription>
            </CardHeader>
            <CardContent>
              <LevelHistogram data={stats.levelHistogram} />
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">CLASS 달성도</CardTitle>
              <CardDescription className="text-xs">에센셜 문제 기준</CardDescription>
            </CardHeader>
            <CardContent>
              <ClassProgress data={stats.classProgress} nextClassInfo={stats.nextClassInfo} />
            </CardContent>
          </Card>
        </div>

        {/* ── 풀이 스타일 ── */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">풀이 스타일 진단</CardTitle>
            <CardDescription className="text-xs">상위 100문제 기준 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <StyleCard data={stats.styleData} />
          </CardContent>
        </Card>

        {/* ── 라이벌 비교 (Client) ── */}
        <RivalSection myHandle={stats.user.handle} />

        {/* ── Claude AI 분석 (Client) ── */}
        <AnalyzeSection handle={stats.user.handle} />

      </div>
    </main>
  );
}
