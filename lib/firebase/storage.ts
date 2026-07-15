import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

let bucket: Bucket | null = null;

function getBucket(): Bucket {
  if (bucket) return bucket;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or FIREBASE_STORAGE_BUCKET env vars (used for project file attachments)."
    );
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") }),
      storageBucket,
    });
  }

  bucket = getStorage().bucket();
  return bucket;
}

export async function ensureAttachmentsBucket(): Promise<void> {
  const [exists] = await getBucket().exists();
  if (!exists) {
    throw new Error(
      "The configured Firebase Storage bucket doesn't exist yet — enable Storage for this project in the Firebase console."
    );
  }
}

export async function uploadAttachmentFile(
  file: File,
  projectId: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const b = getBucket();
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `${projectId}/${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const blob = b.file(storagePath);
  await blob.save(buffer, { contentType: file.type || "application/octet-stream" });
  await blob.makePublic();

  return { storagePath, publicUrl: `https://storage.googleapis.com/${b.name}/${storagePath}` };
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  await getBucket().file(storagePath).delete({ ignoreNotFound: true });
}
