"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const initialForm = {
  name: "",
  ipAddress: "",
  department: "",
  location: "",
  pingInterval: 60,
  failureThreshold: 3,
};

export default function AddDevicePage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [emails, setEmails] = useState([""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          alertEmail: emails.map((mail) => mail.trim()).filter(Boolean).join(","),
          pingInterval: Number(form.pingInterval),
          failureThreshold: Number(form.failureThreshold),
          image: imageBase64 || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save device.");
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
    <>
      <div className="page-header">
        <h1>Add Device</h1>
        <p>Register a new device. Monitoring starts automatically after saving.</p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="name">Device Name</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. EXTERNAL WEBSITE"
            />
          </div>

          <div className="form-field">
            <label htmlFor="ipAddress">IP Address</label>
            <input
              id="ipAddress"
              name="ipAddress"
              value={form.ipAddress}
              onChange={handleChange}
              required
              placeholder="e.g. www.meita-gti.in"
            />
          </div>

          <div className="form-field">
            <label htmlFor="department">Department (Optional)</label>
            <input
              id="department"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. IT"
            />
          </div>

          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              placeholder="e.g. ADMIN"
            />
          </div>

          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
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
                    placeholder="e.g. it@gti.nws.cn"
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

          {/* Device Image Upload */}
          <div className="form-field" style={{ gridColumn: "1 / -1" }}>
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
            {imagePreview && (
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
            )}
          </div>
        </div>

        {error && (
          <p className="error-text" style={{ marginTop: 14 }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Device"}
          </button>
        </div>
      </form>
    </>
  );
}
