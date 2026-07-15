"use server";

import { requireSession } from "@/lib/auth/dal";
import { listForMember, markRead, markAllRead, type Notification } from "@/lib/db/notifications";

const MAX_NOTIFICATIONS = 20;

export async function getMyNotifications(): Promise<Notification[]> {
  const session = await requireSession();
  const all = await listForMember(session.sub);
  return all.slice(0, MAX_NOTIFICATIONS);
}

export async function markNotificationRead(id: string): Promise<void> {
  await requireSession();
  await markRead(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await requireSession();
  await markAllRead(session.sub);
}
