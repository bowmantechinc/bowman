import "server-only";
import { Resend } from "resend";
import { SITE_NAME } from "@/lib/site";

let client: Resend | null = null;

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "Missing RESEND_API_KEY env var. Create a free key at resend.com and add it to your environment."
    );
  }
  if (!client) client = new Resend(key);
  return client;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || `${SITE_NAME} <onboarding@resend.dev>`;
}

export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  roleLabel: string;
  projectName?: string;
  acceptUrl: string;
}): Promise<void> {
  const { to, inviterName, roleLabel, projectName, acceptUrl } = opts;
  const resend = getClient();

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

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send invite email.");
  }
}

export async function sendTaskNotificationEmail(opts: {
  to: string;
  title: string;
  body: string;
  url: string;
}): Promise<void> {
  const { to, title, body, url } = opts;
  const resend = getClient();

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

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    subject: title,
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send notification email.");
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]!);
}
