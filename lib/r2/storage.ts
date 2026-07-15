import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function getBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.ATTACHMENTS_BUCKET) {
    throw new Error("Missing ATTACHMENTS_BUCKET binding. Check the r2_buckets entry in wrangler.jsonc.");
  }
  return env.ATTACHMENTS_BUCKET;
}

function getPublicUrl(): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("Missing R2_PUBLIC_URL env var (used to build public links for project file attachments).");
  }
  return publicUrl.replace(/\/+$/, "");
}

export async function ensureAttachmentsBucket(): Promise<void> {
  // A binding either resolves at Worker startup or it doesn't — no separate
  // reachability probe is needed the way the S3-API-authenticated client required.
  await getBucket();
}

export async function uploadAttachmentFile(
  file: File,
  projectId: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const bucket = await getBucket();
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `${projectId}/${crypto.randomUUID()}${ext}`;
  const buffer = await file.arrayBuffer();

  await bucket.put(storagePath, buffer, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  return { storagePath, publicUrl: `${getPublicUrl()}/${storagePath}` };
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  const bucket = await getBucket();
  await bucket.delete(storagePath);
}
