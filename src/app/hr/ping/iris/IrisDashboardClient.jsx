"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import AlertMailList from "@/app/alerts/AlertMailList";

export default function IrisDashboardClient({ locations, groupedDevices }) {
  const router = useRouter();
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Auto-refresh every 10 seconds for live monitoring
  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [router]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const selectedDeviceLogs = selectedDevice
    ? (selectedDevice.alertLogs || []).map((log) => ({
        ...log,
        device: {
          name: selectedDevice.name,
          ipAddress: selectedDevice.ipAddress,
          department: selectedDevice.department,
          location: selectedDevice.location,
        },
      }))
    : [];

  // Calculate live summary stats from the 12 IRIS devices
  const allDevices = locations.flatMap((loc) => groupedDevices[loc] || []);
  const totalCount = allDevices.length;
  const onlineCount = allDevices.filter(
    (d) => d.status && d.status.toUpperCase() === "ONLINE"
  ).length;
  const offlineCount = allDevices.filter(
    (d) => d.status && d.status.toUpperCase() === "OFFLINE"
  ).length;

  // Shared table cell styling with balanced height
  const thStyle = (isLast) => ({
    padding: "9px 12px",
    textAlign: "left",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    fontWeight: "700",
    borderRight: isLast ? "none" : "1px solid var(--color-border)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: "1.3",
  });

  const tdStyle = (isLast, extra = {}) => ({
    padding: "9px 12px",
    borderRight: isLast ? "none" : "1px solid var(--color-border)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "13px",
    lineHeight: "1.3",
    ...extra,
  });

  // Proportional widths so the table always fills the container width
  const colWidths = ["22%", "20%", "16%", "16%", "16%", "10%"];

  return (
    <>
      <style jsx global>{`
        html,
        body {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
          overflow-y: auto;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .iris-table .badge {
          padding: 3px 9px;
          font-size: 12px;
          gap: 5px;
          line-height: 1.2;
        }
      `}</style>
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header: Title on Left, Total/Online/Offline in the Middle, Live Monitoring on Right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            width: "100%",
            gap: "12px",
          }}
        >
          {/* Left: Title */}
          <div style={{ justifySelf: "start" }}>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: "700",
                margin: 0,
                color: "var(--color-text)",
                whiteSpace: "nowrap",
              }}
            >
              HR , Gate & Time Office Dashboard
            </h1>
          </div>

          {/* Middle: Total, Online, Offline Stats */}
          <div
            style={{
              justifySelf: "center",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 12px",
                borderRadius: "999px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569",
              }}
            >
              <span>Total:</span>
              <strong style={{ color: "#0f172a" }}>{totalCount}</strong>
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 12px",
                borderRadius: "999px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "12px",
                fontWeight: "600",
                color: "#16a34a",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#16a34a",
                }}
              ></span>
              <span>Online:</span>
              <strong>{onlineCount}</strong>
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 12px",
                borderRadius: "999px",
                background: offlineCount > 0 ? "#fef2f2" : "#f8fafc",
                border: offlineCount > 0 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                fontSize: "12px",
                fontWeight: "600",
                color: offlineCount > 0 ? "#dc2626" : "#64748b",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: offlineCount > 0 ? "#dc2626" : "#94a3b8",
                }}
              ></span>
              <span>Offline:</span>
              <strong>{offlineCount}</strong>
            </span>
          </div>

          {/* Right: Live Monitoring Indicator */}
          <div style={{ justifySelf: "end" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "999px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: "11px",
                fontWeight: "600",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#16a34a",
                }}
              ></span>
              Live Monitoring Active
            </div>
          </div>
        </div>

        {/* Locations */}
        {locations.map((loc) => {
          const locDevices = groupedDevices[loc] || [];
          return (
            <div
              key={loc}
              className="card"
              style={{
                padding: "12px 18px",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "var(--color-primary)",
                }}
              >
                📍 {loc} ({locDevices.length})
              </h2>
              {locDevices.length === 0 ? (
                <p
                  style={{
                    color: "var(--color-text-muted)",
                    fontStyle: "italic",
                    fontSize: "12px",
                    margin: "4px 0",
                  }}
                >
                  No devices registered in this location.
                </p>
              ) : (
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <table
                    className="iris-table"
                    style={{
                      width: "100%",
                      minWidth: "750px",
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                    }}
                  >
                    <colgroup>
                      {colWidths.map((w, i) => (
                        <col key={i} style={{ width: w }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr
                        style={{
                          background: "#fafbfc",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <th style={thStyle(false)}>Device Name</th>
                        <th style={thStyle(false)}>IP Address</th>
                        <th style={{ ...thStyle(false), textAlign: "center" }}>Current Status</th>
                        <th style={thStyle(false)}>Recent Offline Time</th>
                        <th style={thStyle(false)}>Recent Online Time</th>
                        <th style={{ ...thStyle(true), textAlign: "center" }}>Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locDevices.map((d) => (
                        <tr
                          key={d.id}
                          style={{ borderBottom: "1px solid var(--color-border)" }}
                        >
                          <td style={tdStyle(false, { fontWeight: "600" })}>
                            {d.name}
                          </td>
                          <td
                            style={tdStyle(false, {
                              fontFamily: "monospace",
                              color: "var(--color-text-muted)",
                            })}
                          >
                            {d.ipAddress}
                          </td>
                          <td style={tdStyle(false, { textAlign: "center" })}>
                            <StatusBadge status={d.status} />
                          </td>
                          <td
                            style={tdStyle(false, {
                              color: d.lastOfflineTime
                                ? "var(--color-offline)"
                                : "var(--color-text-muted)",
                            })}
                          >
                            {formatDate(d.lastOfflineTime)}
                          </td>
                          <td
                            style={tdStyle(false, {
                              color: d.lastOnlineTime
                                ? "var(--color-online)"
                                : "var(--color-text-muted)",
                            })}
                          >
                            {formatDate(d.lastOnlineTime)}
                          </td>
                          <td style={tdStyle(true, { textAlign: "center" })}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setSelectedDevice(d)}
                              style={{
                                fontSize: "12px",
                                padding: "4px 10px",
                                lineHeight: "1.2",
                              }}
                            >
                              📜 Logs ({d.alertLogs?.length || 0})
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* Alert Logs Modal */}
        {selectedDevice && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
            onClick={() => setSelectedDevice(null)}
          >
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "12px",
                width: "95vw",
                maxWidth: "1600px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
                    Alert Logs for {selectedDevice.name}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    IP: {selectedDevice.ipAddress} | Location: {selectedDevice.location}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDevice(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  overflowY: "auto",
                  maxHeight: "calc(90vh - 80px)",
                }}
              >
                <AlertMailList
                  key={selectedDevice.id}
                  alerts={selectedDeviceLogs}
                  initialSearch=""
                  initialMonth="all"
                  initialYear=""
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
