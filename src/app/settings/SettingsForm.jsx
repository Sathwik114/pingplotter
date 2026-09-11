"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    defaultPingInterval: settings.defaultPingInterval,
    defaultFailureThreshold: settings.defaultFailureThreshold,
    dailyReportTime: settings.dailyReportTime || "08:00",
    monitoringEnabled: settings.monitoringEnabled,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          defaultPingInterval: Number(form.defaultPingInterval),
          defaultFailureThreshold: Number(form.defaultFailureThreshold),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save settings.");
        setSaving(false);
        return;
      }

      setSaved(true);
      setSaving(false);
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="defaultPingInterval">Default Ping Interval (sec)</label>
          <input
            id="defaultPingInterval"
            name="defaultPingInterval"
            type="number"
            min="5"
            value={form.defaultPingInterval}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="defaultFailureThreshold">Default Failure Threshold</label>
          <input
            id="defaultFailureThreshold"
            name="defaultFailureThreshold"
            type="number"
            min="1"
            value={form.defaultFailureThreshold}
            onChange={handleChange}
            required
          />
        </div>


        <div className="form-field">
          <label htmlFor="dailyReportTime">Daily Report Time</label>
          <input
            id="dailyReportTime"
            name="dailyReportTime"
            type="time"
            value={form.dailyReportTime}
            onChange={handleChange}
          />
        </div>

        <div className="form-field full">
          <label htmlFor="monitoringEnabled">Monitoring</label>
          <select
            id="monitoringEnabled"
            name="monitoringEnabled"
            value={form.monitoringEnabled ? "true" : "false"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                monitoringEnabled: e.target.value === "true",
              }))
            }
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="error-text" style={{ marginTop: 14 }}>
          {error}
        </p>
      )}
      {saved && (
        <p style={{ marginTop: 14, color: "var(--color-online)", fontSize: 13, fontWeight: 600 }}>
          Settings saved.
        </p>
      )}

      <div style={{ marginTop: 20 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
