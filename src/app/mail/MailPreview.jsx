"use client";

import { useState } from "react";
import styles from "./mail.module.css";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Renders the HTML body of the email exactly as it would look in an inbox. */
function EmailBody({ alert }) {
  const d = alert.device;
  const isOffline = alert.status === "Offline";
  const accentColor = isOffline ? "#dc2626" : "#16a34a";
  const accentBg = isOffline ? "#fef2f2" : "#f0fdf4";
  const icon = isOffline ? "⚠️" : "✅";
  const statusLabel = isOffline ? "OFFLINE" : "ONLINE";
  const alertTime = formatDate(alert.createdAt);

  return (
    <div className={styles.emailBody}>
      {/* Email header bar */}
      <div className={styles.emailHeader} style={{ borderLeftColor: accentColor }}>
        <span className={styles.emailIcon}>{icon}</span>
        <div>
          <div className={styles.emailTitle} style={{ color: accentColor }}>
            {isOffline ? "Device Offline Alert" : "Device Recovery Alert"}
          </div>
          <div className={styles.emailSubject}>
            {isOffline
              ? `[ALERT] ${d?.name || "Unknown"} is Offline`
              : `[RECOVERY] ${d?.name || "Unknown"} is back Online`}
          </div>
        </div>
      </div>

      {/* Email content */}
      <div className={styles.emailContent}>
        <table className={styles.detailTable}>
          <tbody>
            <tr>
              <td className={styles.detailLabel}>Device</td>
              <td className={styles.detailValue}>{d?.name || "—"}</td>
            </tr>
            <tr>
              <td className={styles.detailLabel}>IP Address</td>
              <td className={styles.detailValue}>{d?.ipAddress || "—"}</td>
            </tr>
            {d?.department && (
              <tr>
                <td className={styles.detailLabel}>Department</td>
                <td className={styles.detailValue}>{d.department}</td>
              </tr>
            )}
            {d?.location && (
              <tr>
                <td className={styles.detailLabel}>Location</td>
                <td className={styles.detailValue}>{d.location}</td>
              </tr>
            )}
            <tr>
              <td className={styles.detailLabel}>Status</td>
              <td className={styles.detailValue}>
                <span className={styles.statusPill} style={{ background: accentBg, color: accentColor }}>
                  {statusLabel}
                </span>
              </td>
            </tr>
            {isOffline && d?.failureThreshold && (
              <tr>
                <td className={styles.detailLabel}>Failure Threshold</td>
                <td className={styles.detailValue}>{d.failureThreshold} consecutive failures</td>
              </tr>
            )}
            <tr>
              <td className={styles.detailLabel}>Time</td>
              <td className={styles.detailValue}>{alertTime}</td>
            </tr>
            <tr>
              <td className={styles.detailLabel}>Sent To</td>
              <td className={styles.detailValue}>{alert.email}</td>
            </tr>
            <tr>
              <td className={styles.detailLabel}>Delivery</td>
              <td className={styles.detailValue}>
                <span
                  className={styles.deliveryPill}
                  style={{
                    background: alert.result === "Sent" ? "#dcfce7" : "#fee2e2",
                    color: alert.result === "Sent" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {alert.result === "Sent" ? "✓ Sent" : "✕ Failed"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Device image if available */}
        {d?.image && (
          <div className={styles.deviceImageWrap}>
            <p className={styles.deviceImageLabel}>Device Photo</p>
            <img
              src={d.image}
              alt={`Photo of ${d?.name}`}
              className={styles.deviceImage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MailPreview({ initialAlerts }) {
  const [alerts] = useState(initialAlerts);
  const [selected, setSelected] = useState(initialAlerts[0] || null);
  const [filter, setFilter] = useState("all"); // "all" | "offline" | "recovery"

  const filtered = alerts.filter((a) => {
    if (filter === "offline") return a.status === "Offline";
    if (filter === "recovery") return a.status === "Recovery";
    return true;
  });

  return (
    <div className={styles.shell}>
      {/* LEFT — inbox list */}
      <aside className={styles.inbox}>
        <div className={styles.inboxHeader}>
          <span className={styles.inboxTitle}>Inbox</span>
          <span className={styles.inboxCount}>{filtered.length}</span>
        </div>

        {/* Filter tabs */}
        <div className={styles.filterTabs}>
          {["all", "offline", "recovery"].map((f) => (
            <button
              key={f}
              className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "offline" ? "⚠️ Offline" : "✅ Recovery"}
            </button>
          ))}
        </div>

        {/* Mail list */}
        <div className={styles.mailList}>
          {filtered.length === 0 && (
            <p className={styles.emptyInbox}>No alerts found.</p>
          )}
          {filtered.map((a) => {
            const isOffline = a.status === "Offline";
            const isActive = selected?.id === a.id;
            return (
              <button
                key={a.id}
                className={`${styles.mailItem} ${isActive ? styles.mailItemActive : ""}`}
                onClick={() => setSelected(a)}
              >
                {/* Device image avatar or icon fallback */}
                <div className={styles.mailAvatar}>
                  {a.device?.image ? (
                    <img src={a.device.image} alt="" className={styles.mailAvatarImg} />
                  ) : (
                    <span className={styles.mailAvatarIcon}>{isOffline ? "⚠️" : "✅"}</span>
                  )}
                </div>

                <div className={styles.mailMeta}>
                  <div className={styles.mailMetaTop}>
                    <span className={styles.mailDevice}>{a.device?.name || "Unknown Device"}</span>
                    <span className={styles.mailTime}>
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={styles.mailMetaBottom}>
                    <span
                      className={styles.mailStatus}
                      style={{ color: isOffline ? "#dc2626" : "#16a34a" }}
                    >
                      {isOffline ? "Went Offline" : "Recovered"}
                    </span>
                    <span
                      className={styles.mailDelivery}
                      style={{ color: a.result === "Sent" ? "#16a34a" : "#dc2626" }}
                    >
                      {a.result === "Sent" ? "✓" : "✕"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT — email preview panel */}
      <section className={styles.preview}>
        {selected ? (
          <>
            <div className={styles.previewHeader}>
              <div className={styles.previewDate}>{formatDate(selected.createdAt)}</div>
              <div className={styles.previewTo}>
                <span className={styles.previewToLabel}>To:</span> {selected.email}
              </div>
            </div>
            <EmailBody alert={selected} />
          </>
        ) : (
          <div className={styles.emptyPreview}>
            <span className={styles.emptyPreviewIcon}>📧</span>
            <p>Select an alert from the inbox to preview the email</p>
          </div>
        )}
      </section>
    </div>
  );
}   