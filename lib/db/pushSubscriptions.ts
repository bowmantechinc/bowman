import "server-only";
import { createRepo, type Row } from "@/lib/db/d1-repo";
import { PUSH_SUBSCRIPTIONS_SCHEMA } from "./schema";

export interface PushSubscription {
  id: string;
  memberId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

function toItem(row: Row): PushSubscription {
  return {
    id: row.id,
    memberId: row.memberId,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<PushSubscription>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.memberId !== undefined) row.memberId = item.memberId;
  if (item.endpoint !== undefined) row.endpoint = item.endpoint;
  if (item.p256dh !== undefined) row.p256dh = item.p256dh;
  if (item.auth !== undefined) row.auth = item.auth;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const pushSubscriptionsRepo = createRepo<PushSubscription>(PUSH_SUBSCRIPTIONS_SCHEMA, toItem, toRow);

export async function listForMember(memberId: string): Promise<PushSubscription[]> {
  const all = await pushSubscriptionsRepo.list();
  return all.filter((s) => s.memberId === memberId);
}

export async function removeByEndpoint(endpoint: string): Promise<void> {
  const all = await pushSubscriptionsRepo.list();
  const existing = all.find((s) => s.endpoint === endpoint);
  if (existing) await pushSubscriptionsRepo.remove(existing.id);
}
