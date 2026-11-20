import { prisma } from "@/lib/prisma";
import DeviceTable from "./DeviceTable";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const devices = await prisma.device.findMany({
    orderBy: { name: "asc" },
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
      alertLogs: {
        orderBy: { createdAt: "desc" },
        take: 200,
      },
    },
  });

  const formattedDevices = devices.map((d) => ({
    ...d,
    alertLogs: d.alertLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
    lastOfflineTime:
      d.alertLogs.find(
        (log) =>
          log.status?.toLowerCase().includes("offline") &&
          !log.status.toLowerCase().includes("daily")
      )?.createdAt.toISOString() || null,
    lastOnlineTime:
      d.alertLogs.find((log) =>
        ["recovery", "online"].some((status) =>
          log.status?.toLowerCase().includes(status)
        )
      )?.createdAt.toISOString() || null,
    image: d.imageMimeType
      ? `/api/devices/${d.id}/image?t=${new Date(d.updatedAt).getTime()}`
      : null,
  }));

  return (
    <div className="devices-page-wrapper">
      <div className="page-header">
        <h1>Monitor Devices</h1>
        <p>Live status of all monitored devices</p>
      </div>

      <div className="card devices-card">
        <DeviceTable devices={formattedDevices} />
      </div>
    </div>
  );
}
