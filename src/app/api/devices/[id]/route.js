import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUploadFilePath, getUploadsDir } from "@/lib/uploads";
import fs from "fs";
import path from "path";

/**
 * Saves a base64-encoded image to public/uploads/ and returns its relative URL path.
 * Deletes the old image file if provided.
 * Returns undefined if no imageData is provided.
 */
function saveImage(imageData, oldImagePath, ipAddress) {
  if (!imageData) return undefined;

  // Delete old image if it exists
  if (oldImagePath) {
    try {
      const oldFullPath = getUploadFilePath(oldImagePath);

      if (fs.existsSync(oldFullPath)) {
        fs.unlinkSync(oldFullPath);
      }
    } catch (_) {}
  }

  // Explicitly remove image
  if (imageData === "REMOVE") {
    return null;
  }

  // Expected format:
  // data:image/png;base64,xxxx
  const matches = imageData.match(
    /^data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+);base64,(.+)$/
  );

  if (!matches) return undefined;

  const mimeType = matches[1];
  const base64Data = matches[2];

  const ext = mimeType.split("/")[1].replace("jpeg", "jpg");

  const cleanIp = ipAddress.replace(/[^0-9a-zA-Z.]/g, "_");

  const filename = `${cleanIp}.${ext}`;

  const uploadsDir = getUploadsDir();

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(uploadsDir, filename),
    Buffer.from(base64Data, "base64")
  );

  return `/uploads/${filename}`;
}

/**
 * Deletes the image file associated with a device.
 */
function deleteImageFile(imagePath) {
  if (!imagePath) return;

  try {
    const fullPath = getUploadFilePath(imagePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (_) {}
}

/**
 * GET /api/devices/[id]
 */
export async function GET(request, { params }) {
  try {
    // Next.js 16: params is a Promise
    const { id } = await params;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(device);
  } catch (err) {
    console.error("GET device error:", err);

    return NextResponse.json(
      { error: "Failed to fetch device." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/devices/[id]
 */
export async function PUT(request, { params }) {
  try {
    // Next.js 16: params is a Promise
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

    // Fetch existing device
    const existingDevice = await prisma.device.findUnique({
      where: { id },
    });

    if (!existingDevice) {
      return NextResponse.json(
        { error: "Device not found." },
        { status: 404 }
      );
    }

    // Current image
    let currentImage = existingDevice.image;

    // If IP address changed, rename existing image
    if (
      ipAddress &&
      ipAddress !== existingDevice.ipAddress &&
      existingDevice.image
    ) {
      try {
        const oldPath = getUploadFilePath(existingDevice.image);

        const ext = path.extname(existingDevice.image);

        const cleanIp = ipAddress.replace(
          /[^0-9a-zA-Z.]/g,
          "_"
        );

        const newRelative = `/uploads/${cleanIp}${ext}`;

        const newPath = getUploadFilePath(newRelative);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          currentImage = newRelative;
        }
      } catch (err) {
        console.error(
          "Failed to rename image on IP change:",
          err
        );
      }
    }

    const targetIpAddress =
      ipAddress ||
      existingDevice.ipAddress ||
      "device";

    let newImagePath = saveImage(
      imageData,
      imageData === "REMOVE" ? null : currentImage,
      targetIpAddress
    );

    if (
      newImagePath === undefined &&
      currentImage !== existingDevice.image
    ) {
      newImagePath = currentImage;
    }

    const updateData = {
      ...(name !== undefined && { name }),

      ...(ipAddress !== undefined && {
        ipAddress,
      }),

      ...(department !== undefined && {
        department: department || null,
      }),

      ...(location !== undefined && {
        location: location || null,
      }),

      ...(alertEmail !== undefined && {
        alertEmail,
      }),

      ...(pingInterval !== undefined && {
        pingInterval: Number(pingInterval),
      }),

      ...(failureThreshold !== undefined && {
        failureThreshold: Number(failureThreshold),
      }),

      ...(enabled !== undefined && {
        enabled,
      }),

      ...(newImagePath !== undefined && {
        image: newImagePath,
      }),
    };

    const device = await prisma.device.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(device);
  } catch (err) {
    console.error("PUT device error:", err);

    if (err.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A device with this IP address already exists.",
        },
        { status: 409 }
      );
    }

    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Device not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update device." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/devices/[id]
 */
export async function DELETE(request, { params }) {
  try {
    // Next.js 16: params is a Promise
    const { id } = await params;

    // Fetch device before deleting
    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json(
        { error: "Device not found." },
        { status: 404 }
      );
    }

    await prisma.device.delete({
      where: { id },
    });

    // Delete associated image
    deleteImageFile(device.image);

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("DELETE device error:", err);

    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Device not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete device." },
      { status: 500 }
    );
  }
}