/**
 * Background monitoring worker.
 *
 * Run this as a separate long-running process alongside `next start`:
 *   node worker/monitor.js
 *
 * (In production, run it under pm2 / systemd / a Docker sidecar so it
 * restarts automatically. Next.js API routes are request/response only
 * and cannot host a persistent background loop themselves.)
 *
 * What it does:
 *  - Every SYNC_INTERVAL_MS, re-reads the device list from the DB and makes
 *    sure exactly one ping timer is running per enabled device, using that
 *    device's own pingInterval. Devices that were deleted or disabled have
 *    their timers cleared; newly added/enabled devices get one started.
 *  - Each ping timer: pings the device, writes a PingHistory row, updates
 *    the device's status/responseTime, and on state transitions
 *    (Online -> Offline after failureThreshold misses, or Offline -> Online)
 *    writes an AlertLog row and sends an email.
 *  - Respects the global Settings.monitoringEnabled toggle: when disabled,
 *    all timers are paused (cleared) without touching device rows.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const ping = require("ping");
const nodemailer = require("nodemailer");
const fs = require("fs");

const prisma = new PrismaClient();
const workerLockPath = path.resolve(__dirname, ".monitor.lock");

const SYNC_INTERVAL_MS = 15_000;
const MAX_CONCURRENT_CHECKS = Math.max(
  Number(process.env.MONITOR_CONCURRENCY) || 3,
  1
);

// deviceId -> { timer, intervalSeconds }
const activeTimers = new Map();
const pendingChecks = [];
const inFlightChecks = new Map();
let runningChecks = 0;
let syncInProgress = false;

function getImageFilePath(imagePath) {
  if (!imagePath) return null;

  const uploadsDir =
    process.env.UPLOADS_DIR || path.resolve(__dirname, "..", "public", "uploads");
  return path.join(uploadsDir, path.basename(imagePath));
}

function acquireWorkerLock() {
  try {
    if (fs.existsSync(workerLockPath)) {
      const lockPid = Number(fs.readFileSync(workerLockPath, "utf8"));
      if (lockPid && lockPid !== process.pid) {
        try {
          process.kill(lockPid, 0);
          throw new Error(`another worker is already running (PID ${lockPid})`);
        } catch (err) {
          if (err.message.startsWith("another worker")) throw err;
        }
      }
    }

    fs.writeFileSync(workerLockPath, String(process.pid), { flag: "w" });
  } catch (err) {
    console.error(`[worker] Cannot start: ${err.message}`);
    process.exit(1);
  }
}

function releaseWorkerLock() {
  try {
    if (fs.existsSync(workerLockPath)) {
      const lockPid = Number(fs.readFileSync(workerLockPath, "utf8"));
      if (lockPid === process.pid) fs.unlinkSync(workerLockPath);
    }
  } catch (err) {
    console.error(`[worker] Failed to release lock: ${err.message}`);
  }
}

function drainCheckQueue() {
  while (runningChecks < MAX_CONCURRENT_CHECKS && pendingChecks.length > 0) {
    const nextCheck = pendingChecks.shift();
    runningChecks++;

    performCheck(nextCheck.deviceId)
      .then(nextCheck.resolve)
      .catch(nextCheck.reject)
      .finally(() => {
        runningChecks--;
        inFlightChecks.delete(nextCheck.deviceId);
        drainCheckQueue();
      });
  }
}

function checkDevice(deviceId) {
  const existingCheck = inFlightChecks.get(deviceId);
  if (existingCheck) return existingCheck;

  const checkPromise = new Promise((resolve, reject) => {
    pendingChecks.push({ deviceId, resolve, reject });
    drainCheckQueue();
  });
  inFlightChecks.set(deviceId, checkPromise);
  return checkPromise;
}

async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return settings;
}

/**
 * Sends an HTML alert email. If imagePath is provided (relative URL like /uploads/xxx.png),
 * the image is embedded inline using a CID attachment so it appears in the email body.
 *
 * @param {object} opts
 * @param {string} opts.to         - Recipient email address.
 * @param {string} opts.subject    - Email subject.
 * @param {string} opts.text       - Plain-text fallback.
 * @param {string} opts.html       - HTML body (may reference cid:device-image).
 * @param {string|null} opts.imagePath - Relative URL path from DB, e.g. /uploads/device-123.png
 * @returns {Promise<boolean>}
 */
async function sendMail({ to, subject, text, html, imagePath }) {
  try {
    const host = process.env.SMTP_HOST;
    const parsedPort = Number(process.env.SMTP_PORT);
    const port =
      Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : undefined;
    const secure =
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE.toLowerCase() === "true"
        : port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user;

    if (!host || !port || !from) {
      console.error("[worker] SMTP is not configured via .env; skipping email.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass || "" } : undefined,
    });

    const attachments = [];
    if (imagePath && html) {
      const absoluteImagePath = getImageFilePath(imagePath);
      console.log(`[worker] Looking for device image to attach at: ${absoluteImagePath}`);

      if (fs.existsSync(absoluteImagePath)) {
        try {
          const filename = path.basename(absoluteImagePath);
          attachments.push({
            filename,
            content: fs.readFileSync(absoluteImagePath),
            contentType: `image/${path.extname(filename).slice(1).toLowerCase().replace("jpg", "jpeg")}`,
            cid: "device-image", // references cid:device-image in the html img src
          });
          console.log(`[worker] Attached device image (${filename}) as CID attachment.`);
        } catch (imgErr) {
          console.error("[worker] Failed to attach device image:", imgErr.message);
        }
      } else {
        console.warn(`[worker] Device image not found on disk: ${absoluteImagePath}`);
      }
    }

    const emails = to ? to.split(",").map(e => e.trim()).filter(Boolean) : [];
    if (emails.length === 0) {
      console.error("[worker] No recipient email addresses provided.");
      return false;
    }

    let sentCount = 0;
    for (const email of emails) {
      try {
        await transporter.sendMail({
          from,
          to: email,
          subject,
          text,
          html,
          attachments,
        });
        sentCount++;
        console.log(`[worker] Successfully sent email to ${email}`);
      } catch (sendErr) {
        console.error(`[worker] Failed to send email to ${email}: ${sendErr.message}`);
      }
    }
    return sentCount > 0;
  } catch (err) {
    console.error("[worker] Email send failed:", err.message);
    return false;
  }
}

async function pingHost(ipAddress) {
  try {
    const extra = process.platform === "win32" ? ["-n", "1"] : ["-c", "1"];
    const res = await ping.promise.probe(ipAddress, {
      timeout: 5,
      extra,
    });
    const time =
      res.alive && res.time !== "unknown" ? Math.round(Number(res.time)) : null;
    return { alive: !!res.alive, time };
  } catch (err) {
    console.error(`[worker] Ping error for ${ipAddress}:`, err.message);
    return { alive: false, time: null };
  }
}

async function performCheck(deviceId) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device || !device.enabled) return;

  const { alive, time } = await pingHost(device.ipAddress);

  await prisma.pingHistory.create({
    data: { deviceId: device.id, success: alive, responseTime: time },
  });

  const wasOffline = device.status === "OFFLINE";
  let newFailureCount = alive ? 0 : device.failureCount + 1;
  let newStatus = device.status;

  if (alive) {
    newStatus = "ONLINE";
  } else if (newFailureCount >= device.failureThreshold) {
    newStatus = "OFFLINE";
  }

  // Recompute uptime from aggregate counts instead of loading the last 100 rows
  // into memory for every ping check.
  const [totalHistoryCount, successfulHistoryCount] = await Promise.all([
    prisma.pingHistory.count({ where: { deviceId: device.id } }),
    prisma.pingHistory.count({ where: { deviceId: device.id, success: true } }),
  ]);

  const uptimePercentage = totalHistoryCount
    ? Math.round((successfulHistoryCount / totalHistoryCount) * 1000) / 10
    : 100;

  await prisma.device.update({
    where: { id: device.id },
    data: {
      status: newStatus,
      responseTime: time,
      failureCount: newFailureCount,
      lastCheckedAt: new Date(),
      uptimePercentage,
    },
  });
  console.log(
    `[worker] ${device.name} (${device.ipAddress}) ping=${alive ? "ONLINE" : "OFFLINE"} ` +
      `status=${newStatus} failures=${newFailureCount}/${device.failureThreshold}`
  );

  // Device image section if it exists or matches by IP address
  let resolvedImagePath = device.image;
  if (!resolvedImagePath) {
    const uploadsDir =
      process.env.UPLOADS_DIR || path.resolve(__dirname, "..", "public", "uploads");
    if (fs.existsSync(uploadsDir)) {
      try {
        const files = fs.readdirSync(uploadsDir);
        const cleanIp = device.ipAddress.replace(/[^0-9a-zA-Z.]/g, "_");
        const matchingFile = files.find(file => {
          const ext = path.extname(file).toLowerCase();
          if (![".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(ext)) return false;
          const nameWithoutExt = path.basename(file, ext);
          return nameWithoutExt === cleanIp || nameWithoutExt === device.ipAddress;
        });
        if (matchingFile) {
          resolvedImagePath = `/uploads/${matchingFile}`;
        }
      } catch (err) {
        console.error("[worker] Error reading uploads directory:", err.message);
      }
    }
  }

  let imageUnavailable = false;
  if (resolvedImagePath && !fs.existsSync(getImageFilePath(resolvedImagePath))) {
    imageUnavailable = true;
    console.warn(
      `[worker] Device image is missing on disk; sending alert without photo.`
    );
    resolvedImagePath = null;
  }

  const imageCellHtml = `
      <td style="width: 170px; vertical-align: top; padding-left: 16px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Device Photo</p>
          ${
            resolvedImagePath
              ? `<img src="cid:device-image" alt="Device image" style="width: 100%; max-height: 170px; object-fit: cover; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" />`
              : `<div style="background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 24px 8px; margin-top: 4px;">
                   <div style="font-size: 28px; line-height: 1; margin-bottom: 4px;">📷</div>
                      <span style="font-size: 11px; font-weight: 600; color: #64748b;">
                        ${imageUnavailable ? "Image unavailable" : "No Photo"}
                      </span>
                    </div>`
          }
        </div>
      </td>`;

  // State transition: Online -> Offline
  if (newStatus === "OFFLINE" && !wasOffline) {
    const alertTime = new Date().toLocaleString();
    const plainText = `Device "${device.name}" (${device.ipAddress}) failed to respond after ${device.failureThreshold} attempts as of ${alertTime}.`;
    const htmlBody = `
      <div style="background-color: #f8fafc; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 24px; text-align: center; color: #ffffff;">
            <span style="font-size: 40px; display: block; margin-bottom: 8px;">⚠️</span>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Device Offline Alert</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #fee2e2;">Immediate attention required</p>
          </div>
          
          <!-- Body content -->
          <div style="padding: 24px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #334155; line-height: 1.5;">
              The following device failed to respond to ping checks and is currently <strong>offline</strong>.
            </p>
            
            <!-- Key details and photo in same row -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tbody>
                <tr>
                  <td style="vertical-align: top;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tbody>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b; width: 130px;">Device Name</td>
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${device.name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">IP Address</td>
                          <td style="padding: 10px 0; font-size: 14px; font-family: monospace; font-weight: 600; color: #0f172a;">${device.ipAddress}</td>
                        </tr>
                        ${device.department ? `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Department</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${device.department}</td>
                        </tr>` : ""}
                        ${device.location ? `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Location</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${device.location}</td>
                        </tr>` : ""}
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Status</td>
                          <td style="padding: 10px 0; font-size: 14px;">
                            <span style="background-color: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block;">OFFLINE</span>
                          </td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Failure Limit</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${device.failureThreshold} attempts missed</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Trigger Time</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${alertTime}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  ${imageCellHtml}
                </tr>
              </tbody>
            </table>
          </div>
 
          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">This is an automated alert from the PingPlotter Monitoring System.</p>
          </div>
        </div>
      </div>`;
 
    const sent = await sendMail({
      to: device.alertEmail,
      subject: `[ALERT] ${device.name} is Offline`,
      text: plainText,
      html: htmlBody,
      imagePath: resolvedImagePath || null,
    });
    await prisma.alertLog.create({
      data: {
        deviceId: device.id,
        status: "Offline",
        email: device.alertEmail,
        result: sent ? "Sent" : "Failed",
      },
    });
    console.log(`[worker] ${device.name} -> OFFLINE (email ${sent ? "sent" : "failed"})`);
  }
 
  // State transition: Offline -> Online (recovery)
  if (newStatus === "ONLINE" && wasOffline) {
    const recoveryTime = new Date().toLocaleString();
    const plainText = `Device "${device.name}" (${device.ipAddress}) responded again at ${recoveryTime}.`;
    const htmlBody = `
      <div style="background-color: #f8fafc; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 24px; text-align: center; color: #ffffff;">
            <span style="font-size: 40px; display: block; margin-bottom: 8px;">✅</span>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Device Recovery Alert</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #dcfce7;">Device is back online</p>
          </div>
          
          <!-- Body content -->
          <div style="padding: 24px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #334155; line-height: 1.5;">
              The device is now responding successfully to ping checks and has returned to an <strong>online</strong> state.
            </p>
            
            <!-- Key details and photo in same row -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tbody>
                <tr>
                  <td style="vertical-align: top;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tbody>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b; width: 130px;">Device Name</td>
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${device.name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">IP Address</td>
                          <td style="padding: 10px 0; font-size: 14px; font-family: monospace; font-weight: 600; color: #0f172a;">${device.ipAddress}</td>
                        </tr>
                        ${device.department ? `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Department</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${device.department}</td>
                        </tr>` : ""}
                        ${device.location ? `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Location</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${device.location}</td>
                        </tr>` : ""}
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Status</td>
                          <td style="padding: 10px 0; font-size: 14px;">
                            <span style="background-color: #dcfce7; color: #16a34a; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block;">ONLINE</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #64748b;">Recovery Time</td>
                          <td style="padding: 10px 0; font-size: 14px; color: #334155;">${recoveryTime}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  ${imageCellHtml}
                </tr>
              </tbody>
            </table>
          </div>
 
          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">This is an automated alert from the PingPlotter Monitoring System.</p>
          </div>
        </div>
      </div>`;
 
    const sent = await sendMail({
      to: device.alertEmail,
      subject: `[RECOVERY] ${device.name} is back Online`,
      text: plainText,
      html: htmlBody,
      imagePath: resolvedImagePath || null,
    });
    await prisma.alertLog.create({
      data: {
        deviceId: device.id,
        status: "Recovery",
        email: device.alertEmail,
        result: sent ? "Sent" : "Failed",
      },
    });
    console.log(`[worker] ${device.name} -> RECOVERED (email ${sent ? "sent" : "failed"})`);
  }
}

function startTimer(device) {
  const intervalMs = Math.max(device.pingInterval, 5) * 1000;
  const timer = setInterval(() => {
    checkDevice(device.id).catch((err) =>
      console.error(`[worker] checkDevice(${device.id}) error:`, err)
    );
  }, intervalMs);
  activeTimers.set(device.id, { timer, intervalSeconds: device.pingInterval });
  // fire an immediate first check too
  checkDevice(device.id).catch((err) =>
    console.error(`[worker] initial checkDevice(${device.id}) error:`, err)
  );
}

function stopTimer(deviceId) {
  const entry = activeTimers.get(deviceId);
  if (entry) {
    clearInterval(entry.timer);
    activeTimers.delete(deviceId);
  }
}

async function syncTimers() {
  if (syncInProgress) return;
  syncInProgress = true;

  try {
    const settings = await getSettings();

    if (!settings.monitoringEnabled) {
      if (activeTimers.size > 0) {
        console.log("[worker] Monitoring disabled in Settings — pausing all timers.");
        for (const id of activeTimers.keys()) stopTimer(id);
      }
      return;
    }

    const devices = await prisma.device.findMany({ where: { enabled: true } });
    const currentIds = new Set(devices.map((d) => d.id));

    // Stop timers for devices that were deleted or disabled
    for (const id of activeTimers.keys()) {
      if (!currentIds.has(id)) stopTimer(id);
    }

    // Start/restart timers for new devices or ones whose interval changed
    for (const device of devices) {
      const existing = activeTimers.get(device.id);
      if (!existing) {
        startTimer(device);
        console.log(`[worker] Started monitoring "${device.name}" every ${device.pingInterval}s`);
      } else if (existing.intervalSeconds !== device.pingInterval) {
        stopTimer(device.id);
        startTimer(device);
        console.log(`[worker] Restarted "${device.name}" with new interval ${device.pingInterval}s`);
      }
    }
  } finally {
    syncInProgress = false;
  }
}

async function main() {
  acquireWorkerLock();
  console.log("[worker] Network monitor worker starting...");
  syncTimers().catch((err) =>
    console.error("[worker] Initial device sync failed; will retry:", err)
  );
  setInterval(() => {
    syncTimers().catch((err) => console.error("[worker] syncTimers error:", err));
  }, SYNC_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[worker] Fatal error:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("\n[worker] Shutting down...");
  for (const id of activeTimers.keys()) stopTimer(id);
  releaseWorkerLock();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  for (const id of activeTimers.keys()) stopTimer(id);
  releaseWorkerLock();
  await prisma.$disconnect();
  process.exit(0);
});
