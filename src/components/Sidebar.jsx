"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/devices/add", label: "Add Device", icon: "➕" },
  { href: "/devices", label: "Monitor Devices", icon: "📡" },
  { href: "/alerts", label: "Alert Logs", icon: "📧" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    window.location.href = "/login";
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>IT PING PLOTTER</div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/devices"
              ? pathname === "/devices" || (pathname.startsWith("/devices/") && pathname !== "/devices/add")
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom of sidebar */}
      <div style={{ marginTop: "auto", padding: "16px 12px 0", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#f87171",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span className={styles.icon}>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
