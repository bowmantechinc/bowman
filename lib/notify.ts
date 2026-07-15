import "server-only";
import webpush from "web-push";
import { projectsRepo } from "@/lib/db/projects";
import { membersRepo } from "@/lib/db/members";
import { notificationsRepo, type NotificationType } from "@/lib/db/notifications";
import { listForMember as listPushSubsForMember, removeByEndpoint } from "@/lib/db/pushSubscriptions";
import type { PushSubscription } from "@/lib/db/pushSubscriptions";
import { sendTaskNotificationEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/site";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export interface NotifyOptions {
  projectId: string;
  actorId: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  taskId?: string;
}

export async function notifyProjectMembers(opts: NotifyOptions): Promise<void> {
  const project = await projectsRepo.get(opts.projectId);
  if (!project) return;

  const recipientIds = [...new Set([project.ownerId, ...project.memberIds])].filter(
    (id) => id && id !== opts.actorId
  );
  if (!recipientIds.length) return;

  await Promise.allSettled(recipientIds.map((memberId) => notifyOneMember(memberId, opts)));
}

async function notifyOneMember(memberId: string, opts: NotifyOptions): Promise<void> {
  await notificationsRepo
    .create({
      id: crypto.randomUUID(),
      memberId,
      projectId: opts.projectId,
      taskId: opts.taskId ?? "",
      type: opts.type,
      title: opts.title,
      body: opts.body,
      url: opts.url,
      read: false,
      createdAt: new Date().toISOString(),
    })
    .catch(() => {});

  const subs = await listPushSubsForMember(memberId).catch(() => []);
  await Promise.allSettled(subs.map((sub) => sendPushToSubscription(sub, opts)));

  const member = await membersRepo.get(memberId).catch(() => null);
  if (member?.email) {
    sendTaskNotificationEmail({
      to: member.email,
      title: opts.title,
      body: opts.body,
      url: `${getAppUrl()}${opts.url}`,
    }).catch(() => {});
  }
}

async function sendPushToSubscription(sub: PushSubscription, opts: NotifyOptions): Promise<void> {
  if (!ensureVapidConfigured()) return;
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({ title: opts.title, body: opts.body, url: opts.url })
    );
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await removeByEndpoint(sub.endpoint).catch(() => {});
    }
  }
}
