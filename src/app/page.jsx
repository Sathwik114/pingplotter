import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import StatusBadge from "@/components/StatusBadge";
import DeviceBarChart from "@/components/DeviceBarChart";
import styles from "./dashboard.module.css";
import IpScrollingBar from "@/components/IpScrollingBar";

export const dynamic = "force-dynamic"; // always show fresh monitoring data

async function getDashboardData() {
  const [totalDevices, onlineDevices, offlineDevices, devices, recentDevices, latestAlerts, settings, allDevices] =
    await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { status: "ONLINE" } }),
      prisma.device.count({ where: { status: "OFFLINE" } }),
      prisma.device.findMany({
        where: { responseTime: { not: null } },
        select: { responseTime: true },
      }),
      prisma.device.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, ipAddress: true, status: true, createdAt: true },
      }),
      prisma.alertLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { device: { select: { id: true, name: true } } },
      }),
      getSettings(),
      prisma.device.findMany({
        select: { id: true, name: true, ipAddress: true, status: true, location: true },
      }),
    ]);

  const avgResponseTime = devices.length
    ? Math.round(
        devices.reduce((sum, d) => sum + (d.responseTime || 0), 0) / devices.length
      )
    : 0;

  // Group devices for the full screen bar chart
  const getCategoryData = (categoryName, filterFn) => {
    const filtered = allDevices.filter(filterFn);
    return {
      category: categoryName,
      total: filtered.length,
      working: filtered.filter((d) => d.status === "ONLINE").length,
      devices: filtered.map((d) => ({ name: d.name, status: d.status })),
    };
  };

  const chartData = [
    getCategoryData("Gate - Security area", (d) => d.location === "Gate - Security area"),
    getCategoryData("HR Back Side", (d) => d.location === "HR Back Side"),
    getCategoryData("Time Office", (d) => d.location === "Time Office"),
    getCategoryData(
      "Admin Server (Airtel & BSNL)",
      (d) => d.location === "Admin Server Room" && (d.name === "Airtel" || d.name === "BSNL")
    ),
  ];

  return {
    totalDevices,
    onlineDevices,
    offlineDevices,
    avgResponseTime,
    recentDevices,
    latestAlerts,
    monitoringEnabled: settings.monitoringEnabled,
    chartData,
    allDevices: allDevices.map((d) => ({
      id: d.id,
      name: d.name,
      ipAddress: d.ipAddress,
      status: d.status,
    })),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="full-width-dashboard">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700" }}>Dashboard</h1>
          <p style={{ margin: 0, fontSize: "12px" }}>Overview of your monitored infrastructure</p>
        </div>
        <div className={`card ${styles.statusCard}`} style={{ padding: "8px 16px", display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", height: "fit-content" }}>
          <span>Monitoring service:</span>
          <span className={`badge ${data.monitoringEnabled ? "badge-online" : "badge-offline"}`} style={{ padding: "2px 8px", fontSize: "11px" }}>
            {data.monitoringEnabled ? "🟢 Running" : "🔴 Paused"}
          </span>
        </div>
      </div>

      <div className={styles.cardsGrid}>
        <SummaryCard label="Total Devices" value={data.totalDevices} />
        <SummaryCard label="Online Devices" value={data.onlineDevices} accent="online" />
        <SummaryCard label="Offline Devices" value={data.offlineDevices} accent="offline" />
        <SummaryCard label="Avg Response Time" value={`${data.avgResponseTime} ms`} />
      </div>

      {/* Full screen width bar graph */}
      <DeviceBarChart data={data.chartData} />

      <div className={styles.twoColumn}>
        <section className="card">
          <h2 className={styles.sectionTitle}>Recently Added Devices</h2>
          {data.recentDevices.length === 0 ? (
            <p className="empty-state">No devices yet. Add your first device to get started.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>IP Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDevices.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.ipAddress}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <h2 className={styles.sectionTitle}>Latest Alerts</h2>
          {data.latestAlerts.length === 0 ? (
            <p className="empty-state">No alerts have been triggered yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.latestAlerts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.device?.name || "—"}</td>
                    <td>{a.status}</td>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <IpScrollingBar initialDevices={data.allDevices} />
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className={`card ${styles.summaryCard}`}>
      <span className={styles.summaryLabel}>{label}</span>
      <span
        className={`${styles.summaryValue} ${
          accent === "online" ? styles.online : accent === "offline" ? styles.offline : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
