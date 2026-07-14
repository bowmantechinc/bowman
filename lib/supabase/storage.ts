import "server-only";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const BUCKET = "attachments";

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars (used for project file attachments)."
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false },
      // We only use Storage, not Realtime, but the client still initializes
      // a Realtime transport on Node <22 unless one is provided explicitly.
      realtime: { transport: ws as unknown as typeof WebSocket },
    });
  }
  return client;
}

export async function ensureAttachmentsBucket(): Promise<void> {
  const supabase = getClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes("already exists")) throw new Error(error.message);
}

export async function uploadAttachmentFile(
  file: File,
  projectId: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getClient();
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `${projectId}/${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  const supabase = getClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
