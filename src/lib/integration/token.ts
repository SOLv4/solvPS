import crypto from "crypto";

interface TokenPayload {
  uid: number;
  iat: number;
  exp: number;
  iss: string;
}

const ISSUER = "algo-weakness-analyzer";

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getSecret() {
  const secret = process.env.INTEGRATION_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing INTEGRATION_TOKEN_SECRET (or BETTER_AUTH_SECRET)");
  }
  return secret;
}

function parseBase64urlJson(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const raw = Buffer.from(`${normalized}${pad}`, "base64").toString("utf8");
  return JSON.parse(raw);
}

export function issueIntegrationToken({
  userId,
  expiresInSec = 60 * 60 * 24 * 30,
}: {
  userId: number;
  expiresInSec?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    uid: userId,
    iat: now,
    exp: now + expiresInSec,
    iss: ISSUER,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64url(
    crypto.createHmac("sha256", getSecret()).update(signingInput).digest()
  );

  return `${signingInput}.${signature}`;
}

export function verifyIntegrationToken(token: string) {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = base64url(
    crypto.createHmac("sha256", secret).update(signingInput).digest()
  );

  const sigA = Buffer.from(encodedSignature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    throw new Error("Invalid token signature");
  }

  const header = parseBase64urlJson(encodedHeader) as { alg?: string; typ?: string };
  const payload = parseBase64urlJson(encodedPayload) as TokenPayload;

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Invalid token header");
  }
  if (payload.iss !== ISSUER) {
    throw new Error("Invalid token issuer");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) {
    throw new Error("Token expired");
  }

  return payload;
}
