"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  filterProblems,
  getMockProblems,
  getMockRoadmaps,
  tierPresetOptions,
  type Problem,
  type TierPreset,
} from "@/lib/mock"

export default function TeamProblemsPage() {
  const [problems] = useState<Problem[]>(() => getMockProblems())
  const [roadmaps] = useState(() => getMockRoadmaps())

  const [q, setQ] = useState("")
  const [tierPreset, setTierPreset] = useState<TierPreset>("all")
  const [tagQuery, setTagQuery] = useState("")

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null)
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>("")

  const [problemRoadmapMap, setProblemRoadmapMap] = useState<Record<string, string>>(
    () => {
      const defaultRoadmapId = getMockRoadmaps()[0]?.id ?? ""
      return getMockProblems().reduce<Record<string, string>>((acc, problem) => {
        if (problem.inRoadmap && defaultRoadmapId) {
          acc[problem.id] = defaultRoadmapId
        }
        return acc
      }, {})
    }
  )

  const filtered = useMemo(
    () => filterProblems(problems, { q, tierPreset, tagQuery }),
    [problems, q, tierPreset, tagQuery]
  )

  function handleOpenAddDialog(problemId: string) {
    setSelectedProblemId(problemId)
    const alreadySelected = problemRoadmapMap[problemId]
    setSelectedRoadmapId(alreadySelected ?? roadmaps[0]?.id ?? "")
    setAddDialogOpen(true)
  }

  function handleAddToRoadmap() {
    if (!selectedProblemId || !selectedRoadmapId) {
      return
    }
    setProblemRoadmapMap((prev) => ({
      ...prev,
      [selectedProblemId]: selectedRoadmapId,
    }))
    setAddDialogOpen(false)
  }

  function handleRemoveFromRoadmap(problemId: string) {
    setProblemRoadmapMap((prev) => {
      const next = { ...prev }
      delete next[problemId]
      return next
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">문제 검색</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 size-4" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="문제명 또는 BOJ 번호 검색"
              className="pl-9"
            />
          </div>
          <Select
            value={tierPreset}
            onValueChange={(value) => setTierPreset(value as TierPreset)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="난이도 선택" />
            </SelectTrigger>
            <SelectContent>
              {tierPresetOptions.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  난이도 {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={tagQuery}
            onChange={(event) => setTagQuery(event.target.value)}
            placeholder="태그 필터 (예: 그래프, DP)"
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">검색 결과 {filtered.length}개</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-3 py-3 font-medium">문제</th>
                  <th className="px-3 py-3 font-medium">난이도</th>
                  <th className="px-3 py-3 font-medium">태그</th>
                  <th className="px-3 py-3 font-medium">상태</th>
                  <th className="px-3 py-3 text-right font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((problem) => {
                  const inRoadmap = Boolean(problemRoadmapMap[problem.id])
                  return (
                    <tr key={problem.id} className="border-b last:border-0">
                      <td className="px-3 py-4 align-top">
                        <div className="font-medium">
                          {problem.bojId}. {problem.title}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top text-sm">{problem.level}</td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {problem.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <Badge
                          className="rounded-full"
                          variant={inRoadmap ? "default" : "outline"}
                          style={
                            inRoadmap
                              ? { backgroundColor: "var(--brand-2)", color: "white" }
                              : undefined
                          }
                        >
                          {inRoadmap ? "담김" : "미담김"}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-right align-top">
                        {inRoadmap ? (
                          <Button
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => handleRemoveFromRoadmap(problem.id)}
                          >
                            빼기
                          </Button>
                        ) : (
                          <Button
                            className="rounded-2xl"
                            style={{ backgroundColor: "var(--brand)", color: "white" }}
                            onClick={() => handleOpenAddDialog(problem.id)}
                          >
                            로드맵에 담기
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>로드맵에 담기</DialogTitle>
            <DialogDescription>담을 로드맵을 선택하세요.</DialogDescription>
          </DialogHeader>
          <Select value={selectedRoadmapId} onValueChange={setSelectedRoadmapId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="로드맵 선택" />
            </SelectTrigger>
            <SelectContent>
              {roadmaps.map((roadmap) => (
                <SelectItem key={roadmap.id} value={roadmap.id}>
                  {roadmap.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddToRoadmap}
              disabled={!selectedRoadmapId}
              style={{ backgroundColor: "var(--brand)", color: "white" }}
            >
              담기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
