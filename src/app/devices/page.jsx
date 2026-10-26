import { prisma } from "@/lib/prisma";
import DeviceTable from "./DeviceTable";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const devices = await prisma.device.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="devices-page-wrapper">
      <div className="page-header">
        <h1>Monitor Devices</h1>
        <p>Live status of all monitored devices</p>
      </div>

      <div className="card devices-card">
        <DeviceTable devices={devices} />
      </div>
    </div>
  );
}

