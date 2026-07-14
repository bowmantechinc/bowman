import "server-only";
import { createRepo, type Row } from "@/lib/google/sheet-repo";
import { MEMBERS_SCHEMA } from "./schema";

export interface Member {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  labelId: string;
  initials: string;
  color: string;
  textColor: string;
  createdAt: string;
}

function toItem(row: Row): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    labelId: row.labelId,
    initials: row.initials,
    color: row.color,
    textColor: row.textColor,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Member>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.name !== undefined) row.name = item.name;
  if (item.email !== undefined) row.email = item.email;
  if (item.passwordHash !== undefined) row.passwordHash = item.passwordHash;
  if (item.role !== undefined) row.role = item.role;
  if (item.labelId !== undefined) row.labelId = item.labelId;
  if (item.initials !== undefined) row.initials = item.initials;
  if (item.color !== undefined) row.color = item.color;
  if (item.textColor !== undefined) row.textColor = item.textColor;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const membersRepo = createRepo<Member>(MEMBERS_SCHEMA, toItem, toRow);

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const members = await membersRepo.list();
  return (
    members.find((m) => m.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

const AVATAR_PALETTE: [string, string][] = [
  ["#dbeafe", "#1d4ed8"],
  ["#ede9fe", "#6d28d9"],
  ["#d1fae5", "#047857"],
  ["#fef3c7", "#b45309"],
  ["#fee2e2", "#b91c1c"],
  ["#e0f2fe", "#0369a1"],
];

export function pickAvatarColor(seed: number): [string, string] {
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

export function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
