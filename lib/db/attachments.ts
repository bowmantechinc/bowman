import "server-only";
import { createRepo, type Row } from "@/lib/db/d1-repo";
import { ATTACHMENTS_SCHEMA } from "./schema";
import { toNumber } from "./helpers";

export interface Attachment {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  size: number;
  storagePath: string;
  publicUrl: string;
  uploadedBy: string;
  createdAt: string;
}

function toItem(row: Row): Attachment {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    mimeType: row.mimeType,
    size: toNumber(row.size, 0),
    storagePath: row.storagePath,
    publicUrl: row.publicUrl,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Attachment>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.projectId !== undefined) row.projectId = item.projectId;
  if (item.name !== undefined) row.name = item.name;
  if (item.mimeType !== undefined) row.mimeType = item.mimeType;
  if (item.size !== undefined) row.size = String(item.size);
  if (item.storagePath !== undefined) row.storagePath = item.storagePath;
  if (item.publicUrl !== undefined) row.publicUrl = item.publicUrl;
  if (item.uploadedBy !== undefined) row.uploadedBy = item.uploadedBy;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const attachmentsRepo = createRepo<Attachment>(ATTACHMENTS_SCHEMA, toItem, toRow);
