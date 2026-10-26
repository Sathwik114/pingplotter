import { prisma } from "@/lib/prisma";
import AlertMailList from "./AlertMailList";

export const dynamic = "force-dynamic";

export default async function AlertsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialSearch = resolvedSearchParams?.search || resolvedSearchParams?.ip || "";

  const alerts = await prisma.alertLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      device: {
        select: {
          id: true,
          name: true,
          ipAddress: true,
          department: true,
          location: true,
          failureThreshold: true,
        },
      },
    },
  });

  // Serialise Prisma DateTime objects → ISO strings for client components
  const serialised = alerts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="alerts-page-wrapper">
      <div className="page-header">
        <h1>Alert Logs</h1>
        <p>History of offline and recovery notifications sent to device owners</p>
      </div>
      <AlertMailList alerts={serialised} initialSearch={initialSearch} />
    </div>
  );
}
