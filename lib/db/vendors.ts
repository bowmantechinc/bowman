import "server-only";
import { createRepo, type Row } from "@/lib/db/pg-repo";
import { VENDORS_SCHEMA } from "./schema";

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  licenseStart: string;
  licenseEnd: string;
  supportLevel: string;
  notes: string;
}

function toItem(row: Row): Vendor {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    email: row.email,
    licenseStart: row.licenseStart,
    licenseEnd: row.licenseEnd,
    supportLevel: row.supportLevel,
    notes: row.notes,
  };
}

function toRow(item: Partial<Vendor>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.name !== undefined) row.name = item.name;
  if (item.contact !== undefined) row.contact = item.contact;
  if (item.email !== undefined) row.email = item.email;
  if (item.licenseStart !== undefined) row.licenseStart = item.licenseStart;
  if (item.licenseEnd !== undefined) row.licenseEnd = item.licenseEnd;
  if (item.supportLevel !== undefined) row.supportLevel = item.supportLevel;
  if (item.notes !== undefined) row.notes = item.notes;
  return row;
}

export const vendorsRepo = createRepo<Vendor>(VENDORS_SCHEMA, toItem, toRow);
