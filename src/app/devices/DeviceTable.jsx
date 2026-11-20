"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import AlertMailList from "@/app/alerts/AlertMailList";

function formatDate(dateString) {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function DeviceTable({ devices }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [ipSearch, setIpSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);

  const locations = useMemo(() => {
    const unique = new Set(devices.map((d) => d.location).filter(Boolean));
    return Array.from(unique).sort();
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchLocation = locationFilter === "all" || d.location === locationFilter;
      const matchIp = d.ipAddress.toLowerCase().includes(ipSearch.trim().toLowerCase());
      return matchLocation && matchIp;
    });
  }, [devices, locationFilter, ipSearch]);

  const selectedDeviceLogs = selectedDevice
    ? selectedDevice.alertLogs.map((log) => ({
        ...log,
        device: {
          name: selectedDevice.name,
          ipAddress: selectedDevice.ipAddress,
          department: selectedDevice.department,
          location: selectedDevice.location,
        },
      }))
    : [];

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This also removes its history and alert logs.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete device.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (devices.length === 0) {
    return (
      <p className="empty-state">
        No devices yet. <Link href="/devices/add">Add your first device</Link>.
      </p>
    );
  }

  return (
    <>
      {/* Filtering Header Toolbar positioned at the top right of the page */}
      <div className="devices-filter-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="locationFilter" style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>Location:</label>
          <select
            id="locationFilter"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "13px", outline: "none", backgroundColor: "#fff" }}
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="ipSearch" style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-muted)" }}>Search IP:</label>
          <input
            id="ipSearch"
            type="text"
            placeholder="e.g. 192.168.1.1"
            value={ipSearch}
            onChange={(e) => setIpSearch(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "13px", width: "180px", outline: "none" }}
          />
        </div>
      </div>

      <div className="table-scroll-container devices-monitor-table-scroll">
        <table>
          <thead>
            <tr>
              <th><center>ID</center></th>
              <th><center>Device</center></th>
              <th><center>IP Address</center></th>
              <th><center>Status</center></th>
              <th><center>Location</center></th>
              <th><center>Response Time</center></th>
              <th><center>Last Checked</center></th>
              <th><center>Email</center></th>
              <th><center>Recent Offline Time</center></th>
              <th><center>Recent Online Time</center></th>
              <th><center>Logs</center></th>
              <th><center>Action</center></th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={12} className="empty-state" style={{ padding: "24px", textAlign: "center", fontStyle: "italic", color: "var(--color-text-muted)" }}>
                  No devices match the active filters.
                </td>
              </tr>
            ) : (
              filteredDevices.map((d, idx) => (
                <tr key={d.id} className={d.status === "OFFLINE" ? "offline-row" : ""}>
                  <td><center>{idx + 1}</center></td>
                  <td>{d.name}</td>
                  <td>{d.ipAddress}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>{d.location}</td>
                  <td>{d.responseTime != null ? `${d.responseTime} ms` : "—"}</td>
                  <td>
                    {d.lastCheckedAt
                      ? new Date(d.lastCheckedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>{d.alertEmail}</td>
                  <td className={d.lastOfflineTime ? "device-offline-time" : "device-history-empty"}>
                    {formatDate(d.lastOfflineTime)}
                  </td>
                  <td className={d.lastOnlineTime ? "device-online-time" : "device-history-empty"}>
                    {formatDate(d.lastOnlineTime)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedDevice(d)}
                    >
                      Logs ({d.alertLogs.length})
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/devices/${d.id}/edit`} className="btn btn-secondary">
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(d.id, d.name)}
                        disabled={deletingId === d.id}
                      >
                        {deletingId === d.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDevice && (
        <div className="device-logs-modal-backdrop" onClick={() => setSelectedDevice(null)}>
          <section
            className="device-logs-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="device-logs-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="device-logs-modal-header">
              <div>
                <h2 id="device-logs-title">Alert Logs for {selectedDevice.name}</h2>
                <p>IP: {selectedDevice.ipAddress} | Location: {selectedDevice.location || "—"}</p>
              </div>
              <button
                type="button"
                className="device-logs-modal-close"
                onClick={() => setSelectedDevice(null)}
                aria-label="Close alert logs"
              >
                ×
              </button>
            </header>
            <div className="device-logs-modal-content">
              <AlertMailList
                key={selectedDevice.id}
                alerts={selectedDeviceLogs}
                initialSearch=""
                initialMonth="all"
                initialYear=""
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}