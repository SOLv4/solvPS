import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { tools, executeTool } from "@/lib/status/tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 알고리즘 코딩테스트 전문 멘토입니다.
유저의 핸들을 받으면 다음 순서로 분석하세요:

1. get_user_info로 유저 기본 정보 확인
2. get_tag_stats로 태그별 풀이 통계 조회
3. 데이터를 분석해 취약한 태그 3~5개 선정
   - 풀이 수가 적고 문제 수가 많아 중요도가 높은 태그 우선
   - 메타 태그(ad_hoc, implementation, math, misc)는 제외
4. 선정된 취약 태그마다 search_problems로 현재 티어에 맞는 연습 문제 검색
5. 아래 JSON 형식으로만 응답. JSON 외 다른 텍스트 절대 출력 금지.

{
  "summary": "전체 진단 한 줄 요약 (40자 이내, 친근하게)",
  "weakTags": [
    {
      "key": "태그key",
      "name": "태그 한국어명",
      "solved": 숫자,
      "total": 숫자,
      "reason": "왜 보완이 필요한지 2~3문장",
      "approach": "어떻게 접근할지 2~3문장",
      "problems": [
        { "id": 번호, "title": "문제명", "tier": "G5", "reason": "추천 이유 1문장" }
      ]
    }
  ],
  "roadmap": [
    { "phase": 1, "title": "단계 제목", "duration": "1주", "description": "이 단계에서 할 것", "tags": ["태그key"] }
  ]
}`;

export async function POST(req: NextRequest) {
  const { handle } = await req.json();

  if (!handle) {
    return Response.json({ error: "handle이 필요합니다" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const summarizeToolResult = (toolName: string, raw: string) => {
        try {
          const parsed = JSON.parse(raw);
          if (toolName === "search_problems" && Array.isArray(parsed)) {
            const preview = parsed.slice(0, 2).map((p) => p?.title).filter(Boolean).join(", ");
            return `${parsed.length}개 추천${preview ? ` (${preview})` : ""}`;
          }
          if (toolName === "get_tag_stats" && Array.isArray(parsed)) {
            return `${parsed.length}개 태그 분석 완료`;
          }
          if (toolName === "get_user_info" && parsed && typeof parsed === "object") {
            const tier = typeof parsed.tierName === "string" ? parsed.tierName : "Unknown";
            const solvedCount = typeof parsed.solvedCount === "number" ? parsed.solvedCount.toLocaleString() : "-";
            return `${tier} · ${solvedCount}문제`;
          }
          return undefined;
        } catch {
          return undefined;
        }
      };

      try {
        const messages: Anthropic.MessageParam[] = [
          { role: "user", content: `@${handle} 유저의 알고리즘 약점을 분석하고 맞춤 문제를 추천해줘.` },
        ];

        while (true) {
          const response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools,
            messages,
          });

          if (response.stop_reason === "tool_use") {
            messages.push({ role: "assistant", content: response.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of response.content) {
              if (block.type === "tool_use") {
                send({ type: "tool_call", tool: block.name, input: block.input });

                const result = await executeTool(block.name, block.input as Record<string, string>);

                send({ type: "tool_result", tool: block.name, summary: summarizeToolResult(block.name, result) });

                toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
              }
            }

            messages.push({ role: "user", content: toolResults });
            continue;
          }

          const text = response.content
            .filter((b) => b.type === "text")
            .map((b) => (b as Anthropic.TextBlock).text)
            .join("");

          if (text.trim()) {
            send({ type: "result", text, stopReason: response.stop_reason });
          } else {
            send({ type: "error", message: `모델 응답이 비어 있습니다. stop_reason=${response.stop_reason}` });
          }
          break;
        }
      } catch (err) {
        const msg = String(err);
        if (msg.includes("credit balance") || msg.includes("billing")) {
          send({ type: "error", message: "API 크레딧이 부족합니다. Anthropic 콘솔에서 충전 후 이용해 주세요." });
        } else if (msg.includes("overloaded") || msg.includes("529")) {
          send({ type: "error", message: "AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요." });
        } else {
          send({ type: "error", message: "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
