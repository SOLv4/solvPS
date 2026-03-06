import Anthropic from "@anthropic-ai/sdk";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { integrationSubmissions, teamMembers } from "@/lib/db/schema";

type ReviewResponse = {
  summary: string;
  comparisonPoints: string[];
  leftReview: {
    strengths: string[];
    improvements: string[];
  };
  rightReview: {
    strengths: string[];
    improvements: string[];
  };
  betterChoice: {
    handle: string | null;
    reason: string;
  };
  mergedSuggestion: string;
  reviewFocus: string[];
};

const SYSTEM_PROMPT = `당신은 알고리즘 팀 코드 리뷰어입니다.
두 제출 코드는 같은 BOJ 문제를 푼 코드입니다.
출력은 반드시 JSON 객체 하나만 반환하세요. JSON 외 텍스트 금지.

리뷰 규칙:
1) 정확성 단정 금지 (숨은 반례를 모른다는 전제)
2) 가독성/입출력 처리/예외 안전성/유지보수성을 중심으로 비교
3) 성능 추정은 과장하지 말고 근거가 명확할 때만 언급
4) 비난하지 않고 개선 행동 중심으로 제안

필수 JSON 스키마:
{
  "summary": "두 코드 비교 한 줄 요약",
  "comparisonPoints": ["핵심 비교 포인트", "..."],
  "leftReview": {
    "strengths": ["장점", "..."],
    "improvements": ["개선점", "..."]
  },
  "rightReview": {
    "strengths": ["장점", "..."],
    "improvements": ["개선점", "..."]
  },
  "betterChoice": {
    "handle": "left|right|null",
    "reason": "지금 기준에서 더 나은 선택 사유"
  },
  "mergedSuggestion": "두 코드 장점을 결합한 개선 가이드",
  "reviewFocus": ["가독성", "입출력 처리", "안정성", "유지보수성"]
}`;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function clampCode(source: string, maxChars = 12000) {
  if (source.length <= maxChars) {
    return source;
  }
  return `${source.slice(0, maxChars)}\n\n/* ...truncated... */`;
}

function toStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
}

function parseJsonFromModel(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced =
    trimmed.match(/```json\s*([\s\S]*?)```/i) ??
    trimmed.match(/```\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() || trimmed;

  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function normalizeReview(raw: Record<string, unknown>): ReviewResponse {
  const leftRaw = (raw.leftReview as Record<string, unknown> | undefined) ?? {};
  const rightRaw = (raw.rightReview as Record<string, unknown> | undefined) ?? {};
  const betterRaw = (raw.betterChoice as Record<string, unknown> | undefined) ?? {};

  const betterHandleRaw = String(betterRaw.handle ?? "").trim().toLowerCase();
  const betterHandle =
    betterHandleRaw === "left" || betterHandleRaw === "right" ? betterHandleRaw : null;

  return {
    summary: String(raw.summary ?? "두 코드의 접근은 유사하지만 구현 디테일에서 차이가 있습니다."),
    comparisonPoints: toStringArray(raw.comparisonPoints, [
      "입출력 처리 방식",
      "코드 간결성",
      "가독성 및 명명 규칙",
    ]),
    leftReview: {
      strengths: toStringArray(leftRaw.strengths, ["문제를 해결하는 핵심 로직이 간결합니다."]),
      improvements: toStringArray(leftRaw.improvements, ["입출력 처리 안정성을 높일 여지가 있습니다."]),
    },
    rightReview: {
      strengths: toStringArray(rightRaw.strengths, ["코드 구조가 명확합니다."]),
      improvements: toStringArray(rightRaw.improvements, ["가독성 향상을 위한 정리 여지가 있습니다."]),
    },
    betterChoice: {
      handle: betterHandle,
      reason: String(betterRaw.reason ?? "두 코드 모두 정답 가능성이 높아 목적에 따라 선택 가능합니다."),
    },
    mergedSuggestion: String(
      raw.mergedSuggestion ?? "입출력 안정성과 간결한 표현을 함께 반영한 단일 스타일로 정리해 보세요.",
    ),
    reviewFocus: toStringArray(raw.reviewFocus, ["가독성", "입출력 처리", "안정성", "유지보수성"]),
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!client) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않아 Claude 코드 비교를 실행할 수 없습니다." },
        { status: 503 },
      );
    }

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      teamId?: number;
      problemId?: number;
      leftSubmissionPk?: number;
      rightSubmissionPk?: number;
    };

    const teamId = Number(body.teamId);
    const problemId = Number(body.problemId);
    const leftSubmissionPk = Number(body.leftSubmissionPk);
    const rightSubmissionPk = Number(body.rightSubmissionPk);

    if (!teamId || !problemId || !leftSubmissionPk || !rightSubmissionPk) {
      return NextResponse.json(
        { error: "teamId, problemId, leftSubmissionPk, rightSubmissionPk가 필요합니다." },
        { status: 400 },
      );
    }

    if (leftSubmissionPk === rightSubmissionPk) {
      return NextResponse.json({ error: "서로 다른 두 제출을 선택해 주세요." }, { status: 400 });
    }

    const userId = Number(session.user.id);
    const [membership] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: not a team member" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: integrationSubmissions.id,
        memberHandle: integrationSubmissions.member_handle,
        language: integrationSubmissions.language,
        sourceCode: integrationSubmissions.source_code,
        submissionId: integrationSubmissions.submission_id,
      })
      .from(integrationSubmissions)
      .where(
        and(
          eq(integrationSubmissions.team_id, teamId),
          eq(integrationSubmissions.problem_id, problemId),
          inArray(integrationSubmissions.id, [leftSubmissionPk, rightSubmissionPk]),
        ),
      );

    const left = rows.find((row) => row.id === leftSubmissionPk);
    const right = rows.find((row) => row.id === rightSubmissionPk);

    if (!left || !right) {
      return NextResponse.json(
        { error: "선택한 제출 코드를 찾을 수 없습니다. 다시 선택해 주세요." },
        { status: 404 },
      );
    }

    const prompt = `문제 번호: ${problemId}

[LEFT]
handle: ${left.memberHandle}
language: ${left.language}
submissionId: ${left.submissionId}
code:
${clampCode(left.sourceCode)}

[RIGHT]
handle: ${right.memberHandle}
language: ${right.language}
submissionId: ${right.submissionId}
code:
${clampCode(right.sourceCode)}

JSON 스키마 그대로 응답하세요.
"betterChoice.handle"은 반드시 left/right/null 중 하나를 사용하세요.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = parseJsonFromModel(text);
    if (!parsed) {
      return NextResponse.json(
        { error: "Claude 응답을 JSON으로 해석하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    const normalized = normalizeReview(parsed);
    const mappedBetterChoice =
      normalized.betterChoice.handle === "left"
        ? left.memberHandle
        : normalized.betterChoice.handle === "right"
          ? right.memberHandle
          : null;

    return NextResponse.json({
      result: {
        ...normalized,
        betterChoice: {
          handle: mappedBetterChoice,
          reason: normalized.betterChoice.reason,
        },
      },
    });
  } catch (error) {
    const msg = String(error);
    if (msg.includes("credit balance") || msg.includes("billing")) {
      return NextResponse.json(
        { error: "Anthropic API 크레딧이 부족합니다. 결제/충전 후 다시 시도해 주세요." },
        { status: 402 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
