import nodemailer from "nodemailer";

/**
 * Sends an email using SMTP settings from environment variables.
 * Returns true on success, false on failure (never throws, so callers
 * can still write an AlertLog row with result "Failed").
 */
export async function sendMail({ to, subject, text }) {
  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || undefined;
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user;

    if (!host || !port || !from) {
      console.error("[mailer] SMTP is not configured via .env.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass || "" } : undefined,
    });

    await transporter.sendMail({ from, to, subject, text });

    return true;
  } catch (err) {
    console.error("[mailer] Failed to send email:", err.message);
    return false;
  }
}
