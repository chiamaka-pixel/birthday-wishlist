import { NextResponse } from "next/server";
import { ANALYTICS_COOKIE_NAME } from "@/lib/analytics-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  response.cookies.set(ANALYTICS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}