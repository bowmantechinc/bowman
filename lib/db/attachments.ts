import "server-only";
import { createRepo, type Row } from "@/lib/google/sheet-repo";
import { ATTACHMENTS_SCHEMA } from "./schema";
import { toNumber } from "./helpers";

export interface Attachment {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  size: number;
  driveFileId: string;
  driveUrl: string;
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
    driveFileId: row.driveFileId,
    driveUrl: row.driveUrl,
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
  if (item.driveFileId !== undefined) row.driveFileId = item.driveFileId;
  if (item.driveUrl !== undefined) row.driveUrl = item.driveUrl;
  if (item.uploadedBy !== undefined) row.uploadedBy = item.uploadedBy;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const attachmentsRepo = createRepo<Attachment>(ATTACHMENTS_SCHEMA, toItem, toRow);
