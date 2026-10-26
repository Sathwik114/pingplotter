import { prisma } from "@/lib/prisma";
import IrisDashboardClient from "./IrisDashboardClient";

export const dynamic = "force-dynamic";

async function getIrisDashboardData() {
  const devices = await prisma.device.findMany({
    where: {
      location: {
        in: ["Gate - Security area", "HR Back Side", "Time Office"],
      },
    },
    include: {
      alertLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const devicesWithLogs = devices.map((device) => {
    const lastOffline = device.alertLogs.find((a) => a.status === "Offline");
    const lastRecovery = device.alertLogs.find((a) => a.status === "Recovery");

    return {
      ...device,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString(),
      lastCheckedAt: device.lastCheckedAt ? device.lastCheckedAt.toISOString() : null,
      lastOfflineTime: lastOffline ? lastOffline.createdAt.toISOString() : null,
      lastOnlineTime: lastRecovery ? lastRecovery.createdAt.toISOString() : null,
      alertLogs: device.alertLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  });

  return devicesWithLogs;
}

export default async function IrisDashboardPage() {
  const devices = await getIrisDashboardData();
  const locations = ["Time Office", "Gate - Security area", "HR Back Side"];

  const groupedDevices = locations.reduce((acc, loc) => {
    acc[loc] = devices.filter((d) => d.location === loc);
    return acc;
  }, {});

  return <IrisDashboardClient locations={locations} groupedDevices={groupedDevices} />;
}
