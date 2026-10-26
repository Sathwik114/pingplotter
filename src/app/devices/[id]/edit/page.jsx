import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditDeviceForm from "./EditDeviceForm";

export const dynamic = "force-dynamic";

export default async function EditDevicePage({ params }) {
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
      imageData: true,
      pingInterval: true,
      failureThreshold: true,
      enabled: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!device) {
    notFound();
  }

  // Use dynamic timestamp for cache-busting so browser always loads the latest DB image
  const cacheBust = device.updatedAt ? new Date(device.updatedAt).getTime() : Date.now();
  const deviceForClient = {
    ...device,
    image: device.imageData ? `/api/devices/${device.id}/image?t=${cacheBust}` : null,
    imageData: undefined,
  };

  return (
    <>
      <div className="page-header">
        <h1>Edit Device</h1>
        <p>Update monitoring configuration for {device.name}</p>
      </div>

      <div className="card">
        <EditDeviceForm device={deviceForClient} />
      </div>
    </>
  );
}
