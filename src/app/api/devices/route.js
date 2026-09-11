import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getUploadFilePath, getUploadsDir } from "@/lib/uploads";
import fs from "fs";
import path from "path";

/**
 * Saves a base64-encoded image to public/uploads/ and returns its relative URL path.
 * Returns null if no imageData is provided.
 */
function saveImage(imageData, oldImagePath, ipAddress) {
  if (!imageData) return null;

  // Delete old image if it exists
  if (oldImagePath) {
    try {
      const oldFullPath = getUploadFilePath(oldImagePath);
      if (fs.existsSync(oldFullPath)) fs.unlinkSync(oldFullPath);
    } catch (_) {}
  }

  // imageData is expected as "data:<mime>;base64,<data>"
  const matches = imageData.match(/^data:([A-Za-z0-9+/]+\/[A-Za-z0-9+/]+);base64,(.+)$/);
  if (!matches) return null;

  const mimeType = matches[1];
  const base64Data = matches[2];
  const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
  const cleanIp = ipAddress.replace(/[^0-9a-zA-Z.]/g, "_");
  const filename = `${cleanIp}.${ext}`;
  const uploadsDir = getUploadsDir();

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(base64Data, "base64"));
  return `/uploads/${filename}`;
}

export async function GET() {
  const devices = await prisma.device.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(devices);
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

  const settings = await getSettings();
  const imagePath = saveImage(imageData, null, ipAddress);

  try {
    const device = await prisma.device.create({
      data: {
        name,
        ipAddress,
        department: department || null,
        location: location || null,
        alertEmail,
        image: imagePath,
        pingInterval: pingInterval || settings.defaultPingInterval,
        failureThreshold: failureThreshold || settings.defaultFailureThreshold,
        enabled: true,
        status: "UNKNOWN",
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (err) {
    // Clean up uploaded image if DB insert fails
    if (imagePath) {
      try {
        fs.unlinkSync(getUploadFilePath(imagePath));
      } catch (_) {}
    }
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
