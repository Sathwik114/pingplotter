import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mail
 * Returns the last 200 alert logs with their associated device (including image).
 */
export async function GET() {
  const alerts = await prisma.alertLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      device: {
        select: {
          name: true,
          ipAddress: true,
          department: true,
          location: true,
          image: true,
          failureThreshold: true,
        },
      },
    },
  });
  return NextResponse.json(alerts);
}
