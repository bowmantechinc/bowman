import "server-only";
import { createRepo, type Row } from "@/lib/google/sheet-repo";
import { INVITES_SCHEMA } from "./schema";

export type InviteStatus = "pending" | "accepted" | "revoked";

export interface Invite {
  id: string;
  email: string;
  role: string;
  labelId: string;
  projectId: string;
  invitedBy: string;
  status: InviteStatus;
  createdAt: string;
}

function toItem(row: Row): Invite {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    labelId: row.labelId,
    projectId: row.projectId,
    invitedBy: row.invitedBy,
    status: (row.status as InviteStatus) || "pending",
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Invite>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.email !== undefined) row.email = item.email;
  if (item.role !== undefined) row.role = item.role;
  if (item.labelId !== undefined) row.labelId = item.labelId;
  if (item.projectId !== undefined) row.projectId = item.projectId;
  if (item.invitedBy !== undefined) row.invitedBy = item.invitedBy;
  if (item.status !== undefined) row.status = item.status;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const invitesRepo = createRepo<Invite>(INVITES_SCHEMA, toItem, toRow);
