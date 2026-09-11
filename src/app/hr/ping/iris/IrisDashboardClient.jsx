"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import AlertMailList from "@/app/alerts/AlertMailList";

export default function IrisDashboardClient({ locations, groupedDevices }) {
  const [selectedDevice, setSelectedDevice] = useState(null);

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

  // Shared cell style helpers so header/body columns get a divider line
  // between them (but not after the last column).
  const thStyle = (isLast) => ({
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "11px",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    fontWeight: "700",
    borderRight: isLast ? "none" : "1px solid var(--color-border)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  const tdStyle = (isLast, extra = {}) => ({
    padding: "10px 12px",
    borderRight: isLast ? "none" : "1px solid var(--color-border)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...extra,
  });

  // Proportional widths so the table always fills the container width
  // with no horizontal scrollbar, regardless of screen size.
  const colWidths = ["22%", "20%", "16%", "16%", "16%", "10%"];

  return (
    <>
      <style jsx global>{`
        html,
        body {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
      `}</style>
    <div
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>   
            HR , Gate & Time Office Dashboard
          </h1>
        </div>
        <div
          style={{
            padding: "6px 12px",
            borderRadius: "999px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            fontSize: "12px",
            fontWeight: "600",
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a" }}></span>
          Live Monitoring Active
        </div>
      </div>

      {/* Locations */}
      {locations.map((loc) => {
        const locDevices = groupedDevices[loc] || [];
        return (
          <div key={loc} className="card" style={{ padding: "16px 20px", width: "100%", boxSizing: "border-box" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", color: "var(--color-primary)" }}>
              📍 {loc} ({locDevices.length})
            </h2>
            {locDevices.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "13px" }}>
                No devices registered in this location.
              </p>
            ) : (
              <div>
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "13px" }}>
                  <colgroup>
                    {colWidths.map((w, i) => (
                      <col key={i} style={{ width: w }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#fafbfc", borderBottom: "1px solid var(--color-border)" }}>
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
                      <tr key={d.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={tdStyle(false, { fontWeight: "600" })}>
                          {d.name}
                        </td>
                        <td style={tdStyle(false, { fontFamily: "monospace", color: "var(--color-text-muted)" })}>
                          {d.ipAddress}
                        </td>
                        <td style={tdStyle(false, { textAlign: "center" })}>
                          <StatusBadge status={d.status} />
                        </td>
                        <td style={tdStyle(false, { color: d.lastOfflineTime ? "var(--color-offline)" : "var(--color-text-muted)" })}>
                          {formatDate(d.lastOfflineTime)}
                        </td>
                        <td style={tdStyle(false, { color: d.lastOnlineTime ? "var(--color-online)" : "var(--color-text-muted)" })}>
                          {formatDate(d.lastOnlineTime)}
                        </td>
                        <td style={tdStyle(true, { textAlign: "center" })}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedDevice(d)}
                            style={{ fontSize: "12px", padding: "4px 10px" }}
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
                padding: "16px 20px",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
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

            <div style={{ padding: "20px", overflowY: "auto", maxHeight: "calc(90vh - 90px)" }}>
              <AlertMailList alerts={selectedDeviceLogs} initialSearch={selectedDevice.ipAddress} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}