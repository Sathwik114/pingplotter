import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/devices/[id]/image
 * Retrieves device image directly from the SQL Server database in binary format.
 * Uses no-cache headers to ensure freshly updated images are always visible immediately.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const device = await prisma.device.findUnique({
      where: { id },
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
    console.error("GET /api/devices/[id]/image error:", err);
    return new NextResponse(null, { status: 500 });
  }
}
