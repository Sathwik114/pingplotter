import { prisma } from "@/lib/prisma";
import MailPreview from "./MailPreview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mail Preview | Network Monitor",
  description: "Preview alert emails sent to device owners",
};

export default async function MailPage() {
  const alerts = await prisma.alertLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      device: {
        select: {
          name: true,
          ipAddress: true,
          department: true,
          location: true,
          image: true,
          failureThreshold: true,
        },
      },
    },
  });

  // Prisma DateTime objects are not JSON-serialisable — convert to ISO strings
  const serialised = alerts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <>
      <div className="page-header">
        <h1>Mail Preview</h1>
        <p>Preview alert emails that were sent for device offline / recovery events</p>
      </div>
      <MailPreview initialAlerts={serialised} />
    </>
  );
}
