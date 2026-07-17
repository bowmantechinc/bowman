import "server-only";
import { SITE_NAME } from "@/lib/site";

type EmailProvider = "sendgrid" | "gmail";

function getProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (explicit === "gmail" || explicit === "sendgrid") return explicit;
  return process.env.GOOGLE_REFRESH_TOKEN ? "gmail" : "sendgrid";
}

async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const provider = getProvider();
  if (provider === "gmail") return sendViaGmail(opts);
  return sendViaSendGrid(opts);
}

// --- SendGrid ---

function sendGridFromAddress(): { email: string; name: string } {
  const raw = process.env.SENDGRID_FROM_EMAIL;
  if (!raw) {
    throw new Error(
      "Missing SENDGRID_FROM_EMAIL env var. Verify a sender at sendgrid.com/settings/sender_auth and add its address here."
    );
  }
  const match = raw.match(/^(.*)<(.+)>$/);
  return match ? { name: match[1].trim(), email: match[2].trim() } : { name: SITE_NAME, email: raw.trim() };
}

async function sendViaSendGrid(opts: { to: string; subject: string; html: string }): Promise<void> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    throw new Error(
      "Missing SENDGRID_API_KEY env var. Create a free key at sendgrid.com/settings/api_keys and add it to your environment."
    );
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: sendGridFromAddress(),
      subject: opts.subject,
      content: [{ type: "text/html", value: opts.html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid error (${res.status}): ${body || res.statusText}`);
  }
}

// --- Gmail (Gmail API via OAuth refresh token) ---

async function getGmailAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN env vars for Gmail sending."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google OAuth token refresh failed (${res.status}): ${body || res.statusText}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google OAuth token refresh returned no access_token.");
  return data.access_token;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

async function sendViaGmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const sender = process.env.GMAIL_SENDER_EMAIL;
  if (!sender) {
    throw new Error("Missing GMAIL_SENDER_EMAIL env var — the Gmail address the refresh token authorizes.");
  }

  const accessToken = await getGmailAccessToken();

  const raw = [
    `From: ${SITE_NAME} <${sender}>`,
    `To: ${opts.to}`,
    `Subject: ${encodeSubject(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    opts.html,
  ].join("\r\n");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64UrlEncode(raw) }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${body || res.statusText}`);
  }
}

export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  roleLabel: string;
  projectName?: string;
  acceptUrl: string;
}): Promise<void> {
  const { to, inviterName, roleLabel, projectName, acceptUrl } = opts;

  const subject = projectName
    ? `${inviterName} invited you to "${projectName}" on ${SITE_NAME}`
    : `${inviterName} invited you to ${SITE_NAME}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#18181b">
      <div style="font-size:16px;font-weight:700;margin-bottom:24px">${SITE_NAME}</div>
      <p style="font-size:15px;line-height:1.6">
        <strong>${escapeHtml(inviterName)}</strong> has invited you to join
        ${projectName ? `the <strong>${escapeHtml(projectName)}</strong> project on` : ""}
        ${SITE_NAME} as a <strong>${escapeHtml(roleLabel)}</strong>.
      </p>
      <p style="margin:28px 0">
        <a href="${acceptUrl}" style="background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;display:inline-block">
          Accept invitation
        </a>
      </p>
      <p style="font-size:12px;color:#71717a;line-height:1.6">
        If the button doesn't work, copy this link:<br>
        <a href="${acceptUrl}" style="color:#71717a">${acceptUrl}</a>
      </p>
    </div>
  `.trim();

  await sendEmail({ to, subject, html });
}

export async function sendTaskNotificationEmail(opts: {
  to: string;
  title: string;
  body: string;
  url: string;
}): Promise<void> {
  const { to, title, body, url } = opts;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#18181b">
      <div style="font-size:16px;font-weight:700;margin-bottom:24px">${SITE_NAME}</div>
      <p style="font-size:15px;line-height:1.6">${escapeHtml(body)}</p>
      <p style="margin:28px 0">
        <a href="${url}" style="background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;display:inline-block">
          View in ${SITE_NAME}
        </a>
      </p>
    </div>
  `.trim();

  await sendEmail({ to, subject: title, html });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]!);
}
