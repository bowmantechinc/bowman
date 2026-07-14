import "server-only";
import { Readable } from "node:stream";
import { getDriveApi } from "./sheets-client";

let cachedFolderId: string | null = null;

async function getAppFolderId(): Promise<string> {
  if (cachedFolderId) return cachedFolderId;
  const drive = getDriveApi();
  const folderName = "Bowman Hub Attachments";
  const existing = await drive.files.list({
    q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
  });
  const found = existing.data.files?.[0]?.id;
  if (found) {
    cachedFolderId = found;
    return found;
  }
  const created = await drive.files.create({
    requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  cachedFolderId = created.data.id!;
  return cachedFolderId;
}

export async function uploadToDrive(
  file: File
): Promise<{ driveFileId: string; driveUrl: string }> {
  const drive = getDriveApi();
  const folderId = await getAppFolderId();
  const buffer = Buffer.from(await file.arrayBuffer());

  const created = await drive.files.create({
    requestBody: { name: file.name, parents: [folderId] },
    media: { mimeType: file.type || "application/octet-stream", body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });

  const fileId = created.data.id!;
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  const meta = await drive.files.get({ fileId, fields: "webViewLink" });

  return { driveFileId: fileId, driveUrl: meta.data.webViewLink ?? "" };
}

export async function deleteFromDrive(driveFileId: string): Promise<void> {
  const drive = getDriveApi();
  try {
    await drive.files.delete({ fileId: driveFileId });
  } catch {
    // File may already be gone; ignore.
  }
}
