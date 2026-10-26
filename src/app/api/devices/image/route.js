import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/devices/image?ip=10.40.10.123
 * Retrieves device image by IP address from database in binary format.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get("ip");

    if (!ip) {
      return new NextResponse("IP parameter is required", { status: 400 });
    }

    const device = await prisma.device.findUnique({
      where: { ipAddress: ip },
      select: {
        imageData: true,
        imageMimeType: true,
      },
    });

    if (!device || !device.imageData) {
      return new NextResponse(null, { status: 404 });
    }

    const contentType = device.imageMimeType || "image/png";

    return new NextResponse(device.imageData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err) {
    console.error("GET /api/devices/image error:", err);
    return new NextResponse(null, { status: 500 });
  }
}
