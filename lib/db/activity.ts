import "server-only";
import { createRepo, type Row } from "@/lib/google/sheet-repo";
import { ACTIVITY_SCHEMA } from "./schema";

export interface ActivityEntry {
  id: string;
  icon: string;
  text: string;
  actorId: string;
  createdAt: string;
}

function toItem(row: Row): ActivityEntry {
  return {
    id: row.id,
    icon: row.icon,
    text: row.text,
    actorId: row.actorId,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<ActivityEntry>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.icon !== undefined) row.icon = item.icon;
  if (item.text !== undefined) row.text = item.text;
  if (item.actorId !== undefined) row.actorId = item.actorId;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const activityRepo = createRepo<ActivityEntry>(ACTIVITY_SCHEMA, toItem, toRow);

export async function logActivity(icon: string, text: string, actorId: string) {
  await activityRepo.create({
    id: crypto.randomUUID(),
    icon,
    text,
    actorId,
    createdAt: new Date().toISOString(),
  });
}
