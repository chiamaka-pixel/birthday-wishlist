import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  ANALYTICS_COOKIE_NAME,
  analyticsCookieOptions,
  createAnalyticsSession,
} from "@/lib/analytics-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;

    if (
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 512
    ) {
      return NextResponse.json(
        { error: "Please enter your dashboard password." },
        { status: 400 },
      );
    }

    const configuredPassword =
      process.env.ANALYTICS_DASHBOARD_PASSWORD;

    const configuredSecret =
      process.env.ANALYTICS_DASHBOARD_SECRET;

    if (
      !configuredPassword ||
      !configuredSecret ||
      configuredSecret.length < 32
    ) {
      console.error("Analytics dashboard credentials are not configured.");

      return NextResponse.json(
        { error: "Dashboard authentication is not configured." },
        { status: 500 },
      );
    }

    const suppliedHash = createHash("sha256")
      .update(password)
      .digest();

    const expectedHash = createHash("sha256")
      .update(configuredPassword)
      .digest();

    if (!timingSafeEqual(suppliedHash, expectedHash)) {
      return NextResponse.json(
        { error: "Incorrect dashboard password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
    });

    response.cookies.set(
      ANALYTICS_COOKIE_NAME,
      createAnalyticsSession(),
      analyticsCookieOptions,
    );

    return response;
  } catch (error) {
    console.error("Analytics login error:", error);

    return NextResponse.json(
      { error: "Unable to log in. Please try again." },
      { status: 500 },
    );
  }
}