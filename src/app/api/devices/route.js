import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
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

  // Dynamically compute the image URL from database image data — DB image column stays empty
  const formattedDevices = devices.map((d) => ({
    ...d,
    image: d.imageMimeType
      ? `/api/devices/${d.id}/image?t=${new Date(d.updatedAt).getTime()}`
      : null,
  }));

  return NextResponse.json(formattedDevices);
}

export async function POST(request) {
  const body = await request.json();
  const {
    name,
    ipAddress,
    department,
    location,
    alertEmail,
    pingInterval,
    failureThreshold,
    image: imageData,
  } = body;

  if (!name || !ipAddress || !alertEmail) {
    return NextResponse.json(
      { error: "Device Name, IP Address, and Alert Email are required." },
      { status: 400 }
    );
  }

  let binaryBuffer = null;
  let mimeType = null;

  // Process image purely in memory — zero disk/filesystem writes
  if (imageData && typeof imageData === "string" && imageData.length > 20) {
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
        // Limit maximum image size to 5MB
        if (buffer.length > 0 && buffer.length <= 5 * 1024 * 1024) {
          binaryBuffer = buffer;
          mimeType = detectedMime;
        }
      } catch (err) {
        console.error("Image decode error:", err);
      }
    }
  }

  const settings = await getSettings();

  try {
    const device = await prisma.device.create({
      data: {
        name,
        ipAddress,
        department: department || null,
        location: location || null,
        alertEmail,
        image: null, // Keep image column empty in the database
        imageData: binaryBuffer,
        imageMimeType: mimeType,
        pingInterval: pingInterval || settings.defaultPingInterval,
        failureThreshold: failureThreshold || settings.defaultFailureThreshold,
        enabled: true,
        status: "UNKNOWN",
      },
    });

    // Provide dynamic URL in API response for the frontend
    device.image = binaryBuffer
      ? `/api/devices/${device.id}/image?t=${Date.now()}`
      : null;

    // Do not return raw binary in JSON response
    delete device.imageData;

    return NextResponse.json(device, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "A device with this IP address already exists." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create device." }, { status: 500 });
  }
}
