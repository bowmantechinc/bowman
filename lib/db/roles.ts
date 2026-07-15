import "server-only";
import { createRepo, type Row } from "@/lib/db/d1-repo";
import { ROLES_SCHEMA } from "./schema";

export interface Role {
  id: string;
  label: string;
}

function toItem(row: Row): Role {
  return { id: row.id, label: row.label };
}

function toRow(item: Partial<Role>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.label !== undefined) row.label = item.label;
  return row;
}

export const rolesRepo = createRepo<Role>(ROLES_SCHEMA, toItem, toRow);

export const DEFAULT_ROLES: Role[] = [
  { id: "admin", label: "Admin" },
  { id: "lead", label: "Lead" },
  { id: "member", label: "Member" },
  { id: "viewer", label: "Viewer" },
];
