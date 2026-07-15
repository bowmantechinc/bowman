// Standalone CLI script — deliberately does NOT import the app's
// "server-only"-guarded modules (see scripts/migrate notes). Talks to
// Postgres directly, duplicating the small bit of schema data it needs
// from lib/db/schema.ts, lib/db/roles.ts, and lib/db/labels.ts.
import { config } from "dotenv";
import path from "node:path";
import postgres from "postgres";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

config({ path: path.resolve(__dirname, "../.env.local") });

interface TableSchema {
  name: string;
  headers: string[];
}

const ALL_SCHEMAS: TableSchema[] = [
  { name: "Members", headers: ["id", "name", "email", "passwordHash", "role", "labelId", "initials", "color", "textColor", "createdAt"] },
  { name: "Roles", headers: ["id", "label"] },
  { name: "Labels", headers: ["id", "name", "color"] },
  { name: "Projects", headers: ["id", "name", "description", "ownerId", "memberIds", "color", "stage", "startDate", "dueDate", "createdAt"] },
  { name: "Tasks", headers: ["id", "title", "description", "labelId", "priority", "startDate", "dueDate", "ownerId", "projectId", "status", "createdAt"] },
  { name: "TaskComments", headers: ["id", "taskId", "authorId", "text", "createdAt"] },
  { name: "Risks", headers: ["id", "projectId", "description", "category", "likelihood", "impact", "level", "ownerId", "mitigation", "createdAt"] },
  { name: "Vendors", headers: ["id", "name", "contact", "email", "licenseStart", "licenseEnd", "supportLevel", "notes"] },
  { name: "Resources", headers: ["id", "name", "icon", "detail", "progress", "color", "label"] },
  { name: "Attachments", headers: ["id", "projectId", "name", "mimeType", "size", "storagePath", "publicUrl", "uploadedBy", "createdAt"] },
  { name: "Invites", headers: ["id", "email", "role", "labelId", "projectId", "invitedBy", "status", "createdAt"] },
  { name: "Activity", headers: ["id", "icon", "text", "actorId", "createdAt"] },
  { name: "KnowledgeArticles", headers: ["id", "title", "body", "tags", "linkedView", "createdBy", "updatedAt"] },
  { name: "Notifications", headers: ["id", "memberId", "projectId", "taskId", "type", "title", "body", "url", "read", "createdAt"] },
  { name: "PushSubscriptions", headers: ["id", "memberId", "endpoint", "p256dh", "auth", "createdAt"] },
];

const DEFAULT_ROLES = [
  { id: "admin", label: "Admin" },
  { id: "lead", label: "Lead" },
  { id: "member", label: "Member" },
  { id: "viewer", label: "Viewer" },
];

const DEFAULT_LABELS = [
  { id: "general", name: "General", color: "blue" },
  { id: "design", name: "Design", color: "purple" },
  { id: "engineering", name: "Engineering", color: "teal" },
  { id: "marketing", name: "Marketing", color: "amber" },
];

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("Missing POSTGRES_URL in .env.local");

  const sql = postgres(url, { ssl: "require", prepare: false, max: 1 });

  console.log("Creating tables...");
  for (const schema of ALL_SCHEMAS) {
    const cols = schema.headers
      .map((h, i) =>
        i === 0 ? `${quoteIdent(h)} TEXT PRIMARY KEY` : `${quoteIdent(h)} TEXT NOT NULL DEFAULT ''`
      )
      .join(", ");
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS ${quoteIdent(schema.name)} (_seq BIGSERIAL, ${cols})`);
  }
  console.log(`Verified ${ALL_SCHEMAS.length} tables.`);

  const roleCount = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM ${quoteIdent("Roles")}`);
  if ((roleCount[0] as unknown as { n: number }).n === 0) {
    console.log("Seeding default roles...");
    for (const r of DEFAULT_ROLES) {
      await sql.unsafe(`INSERT INTO ${quoteIdent("Roles")} ("id", "label") VALUES ($1, $2)`, [r.id, r.label]);
    }
  }

  const labelCount = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM ${quoteIdent("Labels")}`);
  if ((labelCount[0] as unknown as { n: number }).n === 0) {
    console.log("Seeding default labels...");
    for (const l of DEFAULT_LABELS) {
      await sql.unsafe(`INSERT INTO ${quoteIdent("Labels")} ("id", "name", "color") VALUES ($1, $2, $3)`, [
        l.id,
        l.name,
        l.color,
      ]);
    }
  }

  const r2AccountId = process.env.R2_ACCOUNT_ID;
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const r2Bucket = process.env.R2_BUCKET_NAME;
  if (r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2Bucket) {
    console.log("Checking R2 bucket...");
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
    });
    try {
      await s3.send(new HeadBucketCommand({ Bucket: r2Bucket }));
      console.log(`R2 bucket "${r2Bucket}" is reachable.`);
    } catch (err) {
      console.warn(`Could not reach R2 bucket "${r2Bucket}":`, err instanceof Error ? err.message : err);
    }
  } else {
    console.warn("Skipping storage check — R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME not set.");
  }

  console.log("Setup complete. Run `npm run dev` and open /setup to create the first admin.");
  await sql.end();
}

main().catch((err) => {
  console.error("Setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
