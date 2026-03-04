"use client"

import { useMemo, useState } from "react"
import { CalendarDaysIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createMockRoadmap, getMockRoadmaps, type Roadmap } from "@/lib/mock"

export default function TeamRoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(() => getMockRoadmaps())
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const sortedRoadmaps = useMemo(
    () =>
      [...roadmaps].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [roadmaps]
  )

  function handleCreateRoadmap() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    const nextRoadmap = createMockRoadmap({
      title: trimmedTitle,
      description,
      orderSeed: roadmaps.length + 1,
    })

    setRoadmaps((prev) => [nextRoadmap, ...prev])
    setTitle("")
    setDescription("")
    setCreateOpen(false)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between gap-4 sm:flex-row">
          <div className="space-y-1">
            <CardTitle className="text-2xl">로드맵</CardTitle>
            <CardDescription>
              문제 학습 경로를 카드로 관리하고 필요한 항목을 빠르게 추가하세요.
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-2xl"
                style={{ backgroundColor: "var(--brand)", color: "white" }}
              >
                <PlusIcon className="size-4" />
                새 로드맵
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>새 로드맵 생성</DialogTitle>
                <DialogDescription>
                  제목과 설명을 입력하면 목록에 바로 추가됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">제목</label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="예: DP 기초 로드맵"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">설명</label>
                  <Input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="예: 점화식 기본 문제부터"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={handleCreateRoadmap}
                  disabled={!title.trim()}
                  style={{ backgroundColor: "var(--brand)", color: "white" }}
                >
                  생성
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedRoadmaps.map((roadmap) => (
          <Card key={roadmap.id} className="rounded-2xl">
            <CardHeader className="space-y-3">
              <CardTitle className="text-lg">{roadmap.title}</CardTitle>
              <CardDescription>{roadmap.description || "설명 없음"}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <div className="text-sm text-muted-foreground">
                문제 수: <strong>{roadmap.problemsCount}</strong>
              </div>
              <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-4" />
                {new Date(roadmap.createdAt).toLocaleDateString("ko-KR")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
