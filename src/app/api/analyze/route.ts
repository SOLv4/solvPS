import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { tools, executeTool } from "@/lib/status/tools";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 알고리즘 코딩테스트 전문 멘토입니다.
유저의 핸들을 받으면 다음 순서로 분석하세요:

1. get_user_info로 유저 기본 정보 확인
2. get_tag_stats로 태그별 풀이 통계 조회
3. 데이터를 분석해 취약한 태그 3~5개 선정
   - 풀이율이 낮고 (solved/total < 30%)
   - 문제 수가 많아 중요도가 높은 태그 우선
   - 메타 태그(ad_hoc, implementation, math, misc)는 제외
4. 선정된 취약 태그마다 search_problems로 현재 티어에 맞는 연습 문제 검색
5. 최종 분석 리포트 작성

최종 리포트 형식:
## 유저 현황
(티어, 레이팅, 풀이 수 요약)

## 취약 태그 분석
(각 취약 태그별: 왜 취약한지, 어떻게 접근할지)

## 맞춤 문제 추천
(태그별로 추천 문제 목록 + 이 문제를 추천하는 이유)

## 학습 우선순위
(어떤 순서로 공부하면 좋은지 구체적 조언)

한국어로 친근하고 실용적으로 작성하세요.`;

export async function POST(req: NextRequest) {
  const { handle } = await req.json();

  if (!handle) {
    return Response.json({ error: "handle이 필요합니다" }, { status: 400 });
  }

  // Streaming 응답 설정
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const messages: Anthropic.MessageParam[] = [
          { role: "user", content: `@${handle} 유저의 알고리즘 약점을 분석하고 맞춤 문제를 추천해줘.` },
        ];

        // Tool Use 루프 - Claude가 done이라고 할 때까지 반복
        while (true) {
          const response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools,
            messages,
          });

          // Claude가 tool을 호출하는 경우
          if (response.stop_reason === "tool_use") {
            // assistant 메시지 저장
            messages.push({ role: "assistant", content: response.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of response.content) {
              if (block.type === "tool_use") {
                send({ type: "tool_call", tool: block.name, input: block.input });

                const result = await executeTool(
                  block.name,
                  block.input as Record<string, string>
                );

                send({ type: "tool_result", tool: block.name });

                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: result,
                });
              }
            }

            // tool 결과를 다음 메시지로 전달
            messages.push({ role: "user", content: toolResults });
            continue;
          }

          // Claude가 최종 답변을 반환하는 경우 (end_turn)
          if (response.stop_reason === "end_turn") {
            const text = response.content
              .filter((b) => b.type === "text")
              .map((b) => (b as Anthropic.TextBlock).text)
              .join("");

            send({ type: "result", text });
            break;
          }

          break;
        }
      } catch (err) {
        send({ type: "error", message: String(err) });
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
