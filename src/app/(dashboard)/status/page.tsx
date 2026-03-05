import { Award, BookOpen, Flame, Gauge, Sparkles, Target, TriangleAlert } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getStatusStats } from "@/lib/status/service";
import { getTierColor } from "@/lib/status/solvedac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LevelHistogram from "@/components/status/LevelHistogram";
import ClassProgress from "@/components/status/ClassProgress";
import StyleCard from "@/components/status/StyleCard";
import RivalSection from "@/app/status/_components/RivalSection";
import AnalyzeSection from "@/app/status/_components/AnalyzeSection";
import AlgoRadarChart from "@/app/status/_components/RadarChartClient";

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default async function StatusPage() {
  const user = await getSessionUser();
  if (!user || !user.boj?.bojHandle) return null;

  const stats = await getStatusStats(user.boj.bojHandle);
  const tierColor = getTierColor(stats.user.tierName);

  const totalInHistogram = stats.levelHistogram.reduce((sum, item) => sum + item.total, 0);
  const solvedInHistogram = stats.levelHistogram.reduce((sum, item) => sum + item.solved, 0);
  const coverage = totalInHistogram > 0 ? Math.round((solvedInHistogram / totalInHistogram) * 1000) / 10 : 0;

  const strongestTag = stats.radarTags[0] ?? null;
  const weakestTag = stats.weakTags[0] ?? null;
  const strongestBand =
    stats.levelHistogram.length > 0
      ? stats.levelHistogram.reduce((best, cur) => (cur.solved > best.solved ? cur : best), stats.levelHistogram[0])
      : null;

  const rankPercent =
    stats.user.rank && stats.siteInfo.totalUsers > 0
      ? Math.round((stats.user.rank / stats.siteInfo.totalUsers) * 1000) / 10
      : null;

  const boardStyle = {
    borderColor: hexToRgba(tierColor, 0.35),
    backgroundImage: `radial-gradient(circle at 0% 0%, #ffffff 0%, ${hexToRgba(tierColor, 0.1)} 45%, ${hexToRgba(tierColor, 0.18)} 100%)`,
    boxShadow: `0 30px 80px -52px ${hexToRgba(tierColor, 0.65)}`,
  };
  const badgeStyle = {
    borderColor: hexToRgba(tierColor, 0.3),
    color: tierColor,
  };
  const statCardStyle = {
    borderColor: hexToRgba(tierColor, 0.18),
  };

  const summaryMetrics = [
    { icon: Gauge, label: "레이팅", value: stats.user.rating.toLocaleString() },
    { icon: BookOpen, label: "풀이 수", value: stats.user.solvedCount.toLocaleString() },
    { icon: Flame, label: "최장 스트릭", value: `${stats.user.maxStreak}일` },
    {
      icon: Award,
      label: "전체 순위",
      value: stats.user.rank ? `${stats.user.rank.toLocaleString()}위` : "-",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border px-6 py-6 sm:px-8 sm:py-8" style={boardStyle}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(tierColor, 0.24) }} />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(tierColor, 0.16) }} />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <Badge className="rounded-full border bg-white/70 px-3 py-1 text-[11px] font-semibold tracking-wide" style={badgeStyle}>
              STATUS INTEL BOARD
            </Badge>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">@{stats.user.handle}</p>
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl" style={{ color: tierColor }}>
                  {stats.user.tierName}
                </h1>
                {stats.user.rank && (
                  <span className="rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600" style={{ borderColor: hexToRgba(tierColor, 0.25) }}>
                    #{stats.user.rank.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">
                전체 {stats.siteInfo.totalUsers.toLocaleString()}명 중{" "}
                {rankPercent ? <span className="font-semibold" style={{ color: tierColor }}>상위 {rankPercent}%</span> : "집계 중"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summaryMetrics.map((item) => (
                <div key={item.label} className="rounded-2xl border bg-white/80 px-3.5 py-3 backdrop-blur" style={statCardStyle}>
                  <div className="mb-2 flex items-center gap-2">
                    <item.icon size={14} style={{ color: tierColor }} />
                    <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: tierColor }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border bg-white/85 p-4" style={statCardStyle}>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={14} style={{ color: tierColor }} />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">강점</p>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {strongestTag ? `${strongestTag.name} (${strongestTag.solved}문제)` : "분석 데이터 없음"}
              </p>
              <p className="mt-1 text-xs text-slate-500">현재 가장 많이 푼 대표 알고리즘 태그</p>
            </div>

            <div className="rounded-2xl border bg-white/85 p-4" style={statCardStyle}>
              <div className="mb-2 flex items-center gap-2">
                <TriangleAlert size={14} style={{ color: tierColor }} />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">보완 포인트</p>
              </div>
              <p className="text-sm font-semibold text-slate-800">{weakestTag ? weakestTag.name : "분석 데이터 없음"}</p>
              <p className="mt-1 text-xs text-slate-500">풀이 수가 적어 우선 보완이 필요한 태그</p>
            </div>

            <div className="rounded-2xl border bg-white/85 p-4" style={statCardStyle}>
              <div className="mb-2 flex items-center gap-2">
                <Target size={14} style={{ color: tierColor }} />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">현재 페이스</p>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {strongestBand
                  ? `${strongestBand.label} 구간 ${strongestBand.solved.toLocaleString()}문제`
                  : "난이도 분석 데이터 없음"}
              </p>
              <p className="mt-1 text-xs text-slate-500">전체 난이도 커버리지 {coverage}%</p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-gray-100 bg-white shadow-sm">
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">태그 분포 레이더</CardTitle>
              <CardDescription className="text-xs">풀이 수 상위 8개 알고리즘의 집중도</CardDescription>
            </div>
            {strongestTag && (
              <Badge className="border border-blue-200 bg-[#F3F7FF] text-[#1248DA]">
                TOP {strongestTag.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AlgoRadarChart data={stats.radarTags} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7 border-gray-100 bg-white shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold text-slate-800">난이도 분포 인사이트</CardTitle>
            <CardDescription className="text-xs">구간별 풀이량과 해결률을 동시에 추적</CardDescription>
          </CardHeader>
          <CardContent>
            <LevelHistogram data={stats.levelHistogram} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-5 border-gray-100 bg-white shadow-sm">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold text-slate-800">CLASS 로드맵</CardTitle>
            <CardDescription className="text-xs">전체 진행률과 에센셜 달성률 동시 비교</CardDescription>
          </CardHeader>
          <CardContent>
            <ClassProgress data={stats.classProgress} nextClassInfo={stats.nextClassInfo} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 bg-white shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="text-base font-semibold text-slate-800">풀이 스타일 프로파일</CardTitle>
          <CardDescription className="text-xs">상위 100문제 난이도/태그 분포 기반 진단</CardDescription>
        </CardHeader>
        <CardContent>
          <StyleCard data={stats.styleData} />
        </CardContent>
      </Card>

      <RivalSection myHandle={stats.user.handle} />
      <AnalyzeSection handle={stats.user.handle} />
    </div>
  );
}
