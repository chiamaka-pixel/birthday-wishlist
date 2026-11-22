import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ANALYTICS_COOKIE_NAME = "julia_analytics_session";

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function getDashboardSecret(): string {
  const secret = process.env.ANALYTICS_DASHBOARD_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Analytics dashboard secret is missing or too short.");
  }

  return secret;
}

export function createAnalyticsSession(): string {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;

  const payload = Buffer.from(
    JSON.stringify({ expiresAt }),
  ).toString("base64url");

  const signature = createHmac("sha256", getDashboardSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export function verifyAnalyticsSession(token: string): boolean {
  try {
    const parts = token.split(".");

    if (parts.length !== 2) return false;

    const [payload, signature] = parts;

    if (!payload || !signature) return false;

    const expectedSignature = createHmac(
      "sha256",
      getDashboardSecret(),
    )
      .update(payload)
      .digest();

    const suppliedSignature = Buffer.from(signature, "base64url");

    if (suppliedSignature.length !== expectedSignature.length) {
      return false;
    }

    if (!timingSafeEqual(suppliedSignature, expectedSignature)) {
      return false;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { expiresAt?: number };

    return (
      typeof session.expiresAt === "number" &&
      session.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}

export async function isAnalyticsAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();

  const token = cookieStore.get(ANALYTICS_COOKIE_NAME)?.value;

  if (!token) return false;

  return verifyAnalyticsSession(token);
}

export const analyticsCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};