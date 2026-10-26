"use client";

import { useState } from "react";

/* ─── helpers ─────────────────────────────────────────────────────────── */

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── Main component ──────────────────────────────────────────────────── */

export default function AlertMailList({
  alerts = [],
  initialSearch = "",
  initialMonth = "all",
  initialYear = "",
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState(initialSearch);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  // When opened with an initialSearch, lock the field unless it's empty
  const ipLocked = Boolean(initialSearch);

  const filtered = alerts.filter((a) => {
    const isOffline = Boolean(a.status && a.status.toLowerCase().includes("offline"));
    const isRecovery = Boolean(
      a.status && (a.status.toLowerCase().includes("recovery") || a.status.toLowerCase().includes("online"))
    );

    if (filter === "offline" && !isOffline) return false;
    if (filter === "recovery" && !isRecovery) return false;

    const d = new Date(a.createdAt);
    if (month !== "all" && MONTH_NAMES[d.getMonth()] !== month) return false;
    if (year !== "" && String(d.getFullYear()) !== String(year)) return false;

    if (search) {
      const q = search.toLowerCase();
      const haystack = `${a.device?.name || ""} ${a.device?.ipAddress || ""} ${a.email || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const offlineCount = alerts.filter((a) => a.status && a.status.toLowerCase().includes("offline")).length;
  const recoveryCount = alerts.filter(
    (a) => a.status && (a.status.toLowerCase().includes("recovery") || a.status.toLowerCase().includes("online"))
  ).length;

  if (alerts.length === 0) {
    return (
      <div className="card" style={{ padding: "60px 20px", textAlign: "center", color: "#667085" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <p>No alerts have been triggered yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          className={`btn ${filter === "all" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setFilter("all")}
          style={{ fontSize: 12, padding: "5px 12px" }}
        >
          All ({alerts.length})
        </button>
        <button
          className={`btn ${filter === "offline" ? "btn-danger" : "btn-secondary"}`}
          onClick={() => setFilter("offline")}
          style={{ fontSize: 12, padding: "5px 12px" }}
        >
          Offline ({offlineCount})
        </button>
        <button
          className={`btn ${filter === "recovery" ? "btn-success" : "btn-secondary"}`}
          onClick={() => setFilter("recovery")}
          style={{ fontSize: 12, padding: "5px 12px" }}
        >
          Recovery ({recoveryCount})
        </button>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #e2e6ec",
            fontSize: 12,
            color: "#1a1f2b",
            background: "#fff",
            outline: "none",
          }}
        >
          <option value="all">All months</option>
          {MONTH_NAMES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Year e.g. 2026"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{
            width: 110,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #e2e6ec",
            fontSize: 12,
            color: "#1a1f2b",
            background: "#fff",
            outline: "none",
          }}
        />

        <input
          type="text"
          placeholder="Search device, IP, or email…"
          value={search}
          onChange={(e) => !ipLocked && setSearch(e.target.value)}
          readOnly={ipLocked}
          disabled={ipLocked}
          style={{
            minWidth: 220,
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #e2e6ec",
            fontSize: 12,
            outline: "none",
            background: ipLocked ? "#f3f4f6" : "#fff",
            color: ipLocked ? "#667085" : "#1a1f2b",
            cursor: ipLocked ? "not-allowed" : "text",
          }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            maxHeight: filtered.length > 10 ? 440 : "none",
            overflowY: filtered.length > 10 ? "auto" : "visible",
            overflowX: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafbfc", borderBottom: "1px solid #eaecf0" }}>
                {["Device", "IP Address", "Department", "Location", "Status", "Result", "Time", "Sent To"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#667085",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      position: "sticky",
                      top: 0,
                      background: "#fafbfc",
                      zIndex: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "30px 20px", textAlign: "center", color: "#667085" }}>
                    <div style={{ marginBottom: "6px" }}>No alerts found matching current filters.</div>
                    {(filter !== "all" || month !== "all" || year !== "" || (search && !ipLocked)) && (
                      <button
                        onClick={() => {
                          setFilter("all");
                          setMonth("all");
                          setYear("");
                          if (!ipLocked) setSearch("");
                        }}
                        style={{
                          fontSize: "12px",
                          color: "var(--color-primary, #3457d5)",
                          background: "none",
                          border: "none",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Reset filters to view all ({alerts.length}) alerts
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const isOffline = Boolean(a.status && a.status.toLowerCase().includes("offline"));
                  const accent = isOffline ? "#dc2626" : "#16a34a";
                  const accentBg = isOffline ? "#fef2f2" : "#f0fdf4";
                  return (
                    <tr key={a.id} style={{ borderBottom: "1px solid #eef1f5" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1a1f2b" }}>
                        {a.device?.name || "Unknown"}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#475467" }}>
                        {a.device?.ipAddress || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475467" }}>
                        {a.device?.department || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475467" }}>
                        {a.device?.location || "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: accentBg,
                          color: accent,
                        }}>
                          {isOffline ? "OFFLINE" : "ONLINE"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: a.result === "Sent" ? "#16a34a" : "#dc2626" }}>
                        {a.result === "Sent" ? "✓ Sent" : "✕ Failed"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#667085", whiteSpace: "nowrap" }}>
                        {formatDate(a.createdAt)}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475467" }}>
                        {a.email}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
