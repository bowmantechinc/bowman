import "server-only";
import { createRepo, type Row } from "@/lib/db/d1-repo";
import { NOTIFICATIONS_SCHEMA } from "./schema";

export type NotificationType = "task_assigned" | "task_comment" | "task_status_changed";

export interface Notification {
  id: string;
  memberId: string;
  projectId: string;
  taskId: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  read: boolean;
  createdAt: string;
}

function toItem(row: Row): Notification {
  return {
    id: row.id,
    memberId: row.memberId,
    projectId: row.projectId,
    taskId: row.taskId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    url: row.url,
    read: row.read === "true",
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Notification>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.memberId !== undefined) row.memberId = item.memberId;
  if (item.projectId !== undefined) row.projectId = item.projectId;
  if (item.taskId !== undefined) row.taskId = item.taskId;
  if (item.type !== undefined) row.type = item.type;
  if (item.title !== undefined) row.title = item.title;
  if (item.body !== undefined) row.body = item.body;
  if (item.url !== undefined) row.url = item.url;
  if (item.read !== undefined) row.read = item.read ? "true" : "";
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const notificationsRepo = createRepo<Notification>(NOTIFICATIONS_SCHEMA, toItem, toRow);

export async function listForMember(memberId: string): Promise<Notification[]> {
  const all = await notificationsRepo.list();
  return all
    .filter((n) => n.memberId === memberId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markRead(id: string): Promise<void> {
  await notificationsRepo.update(id, { read: true });
}

export async function markAllRead(memberId: string): Promise<void> {
  const unread = (await listForMember(memberId)).filter((n) => !n.read);
  await Promise.all(unread.map((n) => notificationsRepo.update(n.id, { read: true })));
}
