import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrationSubmissions, teamMembers, userBoj } from "@/lib/db/schema";
import { verifyIntegrationToken } from "@/lib/integration/token";
import { auth } from "@/lib/auth";

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamId = Number(req.nextUrl.searchParams.get("teamId"));
    const problemIdRaw = req.nextUrl.searchParams.get("problemId");
    const problemId = problemIdRaw ? Number(problemIdRaw) : null;

    if (!teamId || Number.isNaN(teamId)) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
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

    const whereClause =
      problemId && !Number.isNaN(problemId)
        ? and(
            eq(integrationSubmissions.team_id, teamId),
            eq(integrationSubmissions.problem_id, problemId)
          )
        : eq(integrationSubmissions.team_id, teamId);

    const items = await db
      .select({
        id: integrationSubmissions.id,
        teamId: integrationSubmissions.team_id,
        userId: integrationSubmissions.user_id,
        memberHandle: integrationSubmissions.member_handle,
        problemId: integrationSubmissions.problem_id,
        submissionId: integrationSubmissions.submission_id,
        language: integrationSubmissions.language,
        sourceCode: integrationSubmissions.source_code,
        runtimeMs: integrationSubmissions.runtime_ms,
        memoryKb: integrationSubmissions.memory_kb,
        result: integrationSubmissions.result,
        submittedAtRaw: integrationSubmissions.submitted_at_raw,
        capturedAt: integrationSubmissions.captured_at,
      })
      .from(integrationSubmissions)
      .where(whereClause)
      .orderBy(desc(integrationSubmissions.captured_at));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }

    const payload = verifyIntegrationToken(token);
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const teamId = Number(body.teamId ?? payload.tid);
    const userId = Number(payload.uid);

    const [membership] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.team_id, teamId), eq(teamMembers.user_id, userId)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: team membership not found" }, { status: 403 });
    }

    const submissionId = String(body.submissionId || "").trim();
    const problemId = Number(body.problemId);
    const language = String(body.language || "").trim();
    const sourceCode = String(body.sourceCode || "");
    const result = String(body.result || "").trim().toLowerCase();

    if (!submissionId || !problemId || !language || !sourceCode || !result) {
      return NextResponse.json(
        { error: "submissionId, problemId, language, sourceCode, result are required" },
        { status: 400 }
      );
    }

    const [boj] = await db
      .select({ bojHandle: userBoj.bojHandle })
      .from(userBoj)
      .where(eq(userBoj.userId, userId))
      .limit(1);

    const memberHandle =
      String(body.memberHandle || "").trim() || boj?.bojHandle || `user-${userId}`;

    const [existing] = await db
      .select({ id: integrationSubmissions.id })
      .from(integrationSubmissions)
      .where(
        and(
          eq(integrationSubmissions.team_id, teamId),
          eq(integrationSubmissions.submission_id, submissionId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(integrationSubmissions)
        .set({
          member_handle: memberHandle,
          problem_id: problemId,
          language,
          source_code: sourceCode,
          runtime_ms: body.runtimeMs ? Number(body.runtimeMs) : null,
          memory_kb: body.memoryKb ? Number(body.memoryKb) : null,
          result,
          submitted_at_raw: body.submittedAt ? String(body.submittedAt) : null,
        })
        .where(eq(integrationSubmissions.id, existing.id));

      return NextResponse.json({ ok: true, upserted: "updated", id: existing.id });
    }

    const [inserted] = await db
      .insert(integrationSubmissions)
      .values({
        source_platform: String(body.sourcePlatform || "baekjoon"),
        submission_id: submissionId,
        team_id: teamId,
        user_id: userId,
        member_handle: memberHandle,
        problem_id: problemId,
        language,
        source_code: sourceCode,
        runtime_ms: body.runtimeMs ? Number(body.runtimeMs) : null,
        memory_kb: body.memoryKb ? Number(body.memoryKb) : null,
        result,
        submitted_at_raw: body.submittedAt ? String(body.submittedAt) : null,
      })
      .returning({ id: integrationSubmissions.id });

    return NextResponse.json({ ok: true, upserted: "inserted", id: inserted.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
