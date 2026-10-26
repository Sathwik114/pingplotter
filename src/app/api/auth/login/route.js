import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Query UserMast where Username and Password match
    const users = await prisma.$queryRaw`
      SELECT TOP 1 Username
      FROM UserMast
      WHERE Username = ${username} AND Password = ${password}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const matchedUsername = users[0].Username;
    const token = await createSessionToken(matchedUsername);

    const response = NextResponse.json({
      success: true,
      username: matchedUsername,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "An internal server error occurred during login" },
      { status: 500 }
    );
  }
}
