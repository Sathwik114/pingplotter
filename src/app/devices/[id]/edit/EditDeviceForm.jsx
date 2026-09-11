"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function EditDeviceForm({ device }) {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Form states
  const [form, setForm] = useState({
    name: device.name,
    ipAddress: device.ipAddress,
    department: device.department || "",
    location: device.location || "",
    pingInterval: device.pingInterval,
    failureThreshold: device.failureThreshold,
    enabled: device.enabled,
  });

  const [emails, setEmails] = useState(
    device.alertEmail
      ? device.alertEmail.split(",").map((e) => e.trim()).filter(Boolean)
      : [""]
  );

  // Image state
  const [imagePreview, setImagePreview] = useState(device.image || null);
  const [imageBase64, setImageBase64] = useState(null); // new image to upload
  const [removeImage, setRemoveImage] = useState(false);  // flag to delete existing image
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImageBase64(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageBase64(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    let imagePayload;
    if (imageBase64) {
      imagePayload = imageBase64;
    } else if (removeImage) {
      imagePayload = "REMOVE";
    }

    try {
      const res = await fetch(`/api/devices/${device.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          alertEmail: emails.map((mail) => mail.trim()).filter(Boolean).join(","),
          pingInterval: Number(form.pingInterval),
          failureThreshold: Number(form.failureThreshold),
          ...(imagePayload !== undefined && { image: imagePayload }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update device.");
        setSaving(false);
        return;
      }

      router.push("/devices");
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Row 1: Name, IP Address, Department, Location in a single row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }}>
          <div className="form-field">
            <label htmlFor="name">Device Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-field">
            <label htmlFor="ipAddress">IP Address</label>
            <input
              id="ipAddress"
              name="ipAddress"
              value={form.ipAddress}
              disabled
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="department">Department (Optional)</label>
            <input
              id="department"
              name="department"
              value={form.department}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input id="location" name="location" value={form.location} onChange={handleChange} required />
          </div>
        </div>

        {/* Row 2: Ping Interval, Failure Threshold, Monitoring in a single row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
          <div className="form-field">
            <label htmlFor="pingInterval">Ping Interval (Seconds)</label>
            <input
              id="pingInterval"
              name="pingInterval"
              type="number"
              min="5"
              value={form.pingInterval}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="failureThreshold">Failure Threshold</label>
            <input
              id="failureThreshold"
              name="failureThreshold"
              type="number"
              min="1"
              value={form.failureThreshold}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="enabled">Monitoring</label>
            <select
              id="enabled"
              name="enabled"
              value={form.enabled ? "true" : "false"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, enabled: e.target.value === "true" }))
              }
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>

        {/* Row 3: Alert Emails */}
        <div className="form-field">
          <label>Alert Emails</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
            {emails.map((email, index) => (
              <div key={index} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const newEmails = [...emails];
                    newEmails[index] = e.target.value;
                    setEmails(newEmails);
                  }}
                  required
                  placeholder="e.g. admin@company.com"
                  style={{ flex: 1, paddingRight: emails.length > 1 ? "36px" : "12px" }}
                />
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newEmails = emails.filter((_, i) => i !== index);
                      setEmails(newEmails);
                    }}
                    style={{
                      position: "absolute",
                      right: "8px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "10px",
                      lineHeight: 1,
                      padding: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      transition: "background 0.2s"
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEmails([...emails, ""])}
              style={{
                alignSelf: "flex-start",
                padding: "6px 12px",
                background: "var(--color-primary, #2563eb)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              + Add Email
            </button>
          </div>
        </div>

        {/* Row 4: Device Image Upload */}
        <div className="form-field">
          <label htmlFor="deviceImage">Device Image (Optional)</label>
          <input
            id="deviceImage"
            name="deviceImage"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ paddingTop: 6 }}
          />
          {imagePreview ? (
            <div style={{ marginTop: 12 }}>
              <img
                src={imagePreview}
                alt="Device preview"
                style={{
                  maxWidth: 200,
                  maxHeight: 150,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRemoveImage}
                style={{ marginTop: 8, fontSize: "0.8rem", padding: "4px 12px" }}
              >
                Remove Image
              </button>
            </div>
          ) : (
            <p style={{ marginTop: 6, fontSize: "0.82rem", color: "var(--text-muted, #888)" }}>
              No image set. Upload one above.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="error-text" style={{ marginTop: 14 }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => router.push("/devices")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
