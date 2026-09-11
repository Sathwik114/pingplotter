export default function StatusBadge({ status }) {
  const map = {
    ONLINE: { className: "badge-online", icon: "🟢", label: "Online" },
    OFFLINE: { className: "badge-offline", icon: "🔴", label: "Offline" },
    UNKNOWN: { className: "badge-unknown", icon: "⚪", label: "Unknown" },
  };
  const { className, icon, label } = map[status] || map.UNKNOWN;

  return (
    <span className={`badge ${className}`}>
      {icon} {label}
    </span>
  );
}
