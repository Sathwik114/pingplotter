import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isSecureRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
