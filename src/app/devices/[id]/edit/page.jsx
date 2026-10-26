import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getUploadsDir } from "@/lib/uploads";
import fs from "fs";
import path from "path";
import EditDeviceForm from "./EditDeviceForm";

export const dynamic = "force-dynamic";

function resolveDeviceImage(device) {
  if (device.image) return device.image;

  const uploadsDir = getUploadsDir();
  if (!fs.existsSync(uploadsDir)) return null;

  const cleanIp = device.ipAddress.replace(/[^0-9a-zA-Z.]/g, "_");
  const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
  const matchingFile = fs.readdirSync(uploadsDir).find((file) => {
    const extension = path.extname(file).toLowerCase();
    return imageExtensions.has(extension) && path.basename(file, extension) === cleanIp;
  });

  return matchingFile ? `/uploads/${matchingFile}` : null;
}

export default async function EditDevicePage({ params }) {
  const { id } = await params;

  const device = await prisma.device.findUnique({
    where: { id },
  });

  if (!device) {
    notFound();
  }

  const deviceWithImage = {
    ...device,
    image: resolveDeviceImage(device),
  };

  return (
    <>
      <div className="page-header">
        <h1>Edit Device</h1>
        <p>Update monitoring configuration for {device.name}</p>
      </div>

      <div className="card">
        <EditDeviceForm device={deviceWithImage} />
      </div>
    </>
  );
}