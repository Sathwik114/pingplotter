import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/devices/[id]
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const device = await prisma.device.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ipAddress: true,
        department: true,
        location: true,
        alertEmail: true,
        imageMimeType: true,
        pingInterval: true,
        failureThreshold: true,
        enabled: true,
        status: true,
        responseTime: true,
        failureCount: true,
        lastCheckedAt: true,
        uptimePercentage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    const deviceWithImage = {
      ...device,
      image: device.imageMimeType
        ? `/api/devices/${device.id}/image?t=${new Date(device.updatedAt).getTime()}`
        : null,
    };

    return NextResponse.json(deviceWithImage);
  } catch (err) {
    console.error("GET device error:", err);
    return NextResponse.json({ error: "Failed to fetch device." }, { status: 500 });
  }
}

/**
 * PUT /api/devices/[id]
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      ipAddress,
      department,
      location,
      alertEmail,
      pingInterval,
      failureThreshold,
      enabled,
      image: imageData,
    } = body;

    const existingDevice = await prisma.device.findUnique({
      where: { id },
    });

    if (!existingDevice) {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(ipAddress !== undefined && { ipAddress }),
      ...(department !== undefined && { department: department || null }),
      ...(location !== undefined && { location: location || null }),
      ...(alertEmail !== undefined && { alertEmail }),
      ...(pingInterval !== undefined && { pingInterval: Number(pingInterval) }),
      ...(failureThreshold !== undefined && { failureThreshold: Number(failureThreshold) }),
      ...(enabled !== undefined && { enabled }),
    };

    if (imageData === "REMOVE") {
      updateData.imageData = null;
      updateData.imageMimeType = null;
      updateData.image = null;
    } else if (imageData && typeof imageData === "string" && imageData.length > 20) {
      let detectedMime = "image/png";
      let base64String = imageData;

      if (imageData.startsWith("data:")) {
        const commaIdx = imageData.indexOf(",");
        if (commaIdx !== -1) {
          const header = imageData.substring(5, commaIdx);
          detectedMime = header.split(";")[0].toLowerCase().trim() || "image/png";
          base64String = imageData.substring(commaIdx + 1);
        }
      }

      // Security: Only accept valid image MIME types
      if (detectedMime.startsWith("image/")) {
        try {
          const buffer = Buffer.from(base64String, "base64");
          // Max size: 5MB
          if (buffer.length > 0 && buffer.length <= 5 * 1024 * 1024) {
            updateData.imageData = buffer;
            updateData.imageMimeType = detectedMime;
            updateData.image = null; // Keep image column empty in DB
          }
        } catch (bufErr) {
          console.error("Failed to parse base64 image data:", bufErr);
        }
      }
    }

    const device = await prisma.device.update({
      where: { id },
      data: updateData,
    });

    delete device.imageData;
    device.image = device.imageMimeType
      ? `/api/devices/${device.id}/image?t=${Date.now()}`
      : null;

    return NextResponse.json(device);
  } catch (err) {
    console.error("PUT device error:", err);

    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A device with this IP address already exists." },
        { status: 409 }
      );
    }

    if (err.code === "P2025") {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update device." }, { status: 500 });
  }
}

/**
 * DELETE /api/devices/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    await prisma.device.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE device error:", err);

    if (err.code === "P2025") {
      return NextResponse.json({ error: "Device not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete device." }, { status: 500 });
  }
}
