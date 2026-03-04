"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockProblemsByRoadmapId, getMockRoadmapById, type Problem } from "@/lib/mock";

export default function RoadmapDetailPage() {
  const params = useParams<{ teamId: string; roadmapId: string }>();
  const teamId = params?.teamId ?? "1";
  const roadmapId = params?.roadmapId ?? "";
  const roadmap = getMockRoadmapById(roadmapId);
  const [problems, setProblems] = useState<Problem[]>(() =>
    getMockProblemsByRoadmapId(roadmapId),
  );

  function handleDeleteProblem(problemId: string) {
    setProblems((prev) => prev.filter((problem) => problem.id !== problemId));
  }

  if (!roadmap) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>로드맵을 찾을 수 없습니다.</CardTitle>
            <CardDescription>목록으로 돌아가서 다시 선택해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href={`/teams/${teamId}/roadmaps`}>목록으로</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{roadmap.title}</h1>
          <p className="text-sm text-muted-foreground">{roadmap.description || "설명 없음"}</p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href={`/teams/${teamId}/roadmaps`}>
            <ArrowLeftIcon className="size-4" />
            목록으로
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>담긴 문제 {problems.length}개</CardTitle>
          <CardDescription>현재 로드맵에 포함된 문제 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {problems.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 담긴 문제가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {problems.map((problem) => (
                <div key={problem.id} className="rounded-2xl border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">
                      {problem.bojId}. {problem.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: "var(--brand-2)", color: "white" }}>
                        level {problem.level}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-2xl text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteProblem(problem.id)}
                      >
                        <Trash2Icon className="size-4" />
                        문제 삭제
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
