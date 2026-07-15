import "server-only";
import { DeleteObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getEnv() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      "Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, or R2_PUBLIC_URL env vars (used for project file attachments)."
    );
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl: publicUrl.replace(/\/+$/, "") };
}

function getClient(accountId: string, accessKeyId: string, secretAccessKey: string): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function ensureAttachmentsBucket(): Promise<void> {
  const { accountId, accessKeyId, secretAccessKey, bucket } = getEnv();
  await getClient(accountId, accessKeyId, secretAccessKey).send(new HeadBucketCommand({ Bucket: bucket }));
}

export async function uploadAttachmentFile(
  file: File,
  projectId: string
): Promise<{ storagePath: string; publicUrl: string }> {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = getEnv();
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const storagePath = `${projectId}/${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await getClient(accountId, accessKeyId, secretAccessKey).send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storagePath,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return { storagePath, publicUrl: `${publicUrl}/${storagePath}` };
}

export async function deleteAttachmentFile(storagePath: string): Promise<void> {
  const { accountId, accessKeyId, secretAccessKey, bucket } = getEnv();
  await getClient(accountId, accessKeyId, secretAccessKey).send(
    new DeleteObjectCommand({ Bucket: bucket, Key: storagePath })
  );
}
