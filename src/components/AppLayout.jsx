"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const isIrisDashboard = pathname === "/hr/ping/iris";

  if (isIrisDashboard) {
    return <main style={{ width: "100%", minHeight: "100vh", padding: 0, margin: 0 }}>{children}</main>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
