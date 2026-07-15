// Standalone CLI script — deliberately does NOT import the app's
// "server-only"-guarded modules (see scripts/migrate notes). Talks to
// Postgres directly, duplicating the small bit of schema data it needs
// from lib/db/schema.ts, lib/db/roles.ts, and lib/db/labels.ts.
import { config } from "dotenv";
import path from "node:path";
import postgres from "postgres";
import { cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

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

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (projectId && clientEmail && privateKey && storageBucket) {
    console.log("Checking Firebase Storage bucket...");
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") }),
      storageBucket,
    });
    const [exists] = await getStorage().bucket().exists();
    if (exists) console.log(`Firebase Storage bucket "${storageBucket}" is reachable.`);
    else console.warn(`Bucket "${storageBucket}" doesn't exist — enable Storage for this project in the Firebase console.`);
  } else {
    console.warn("Skipping storage check — FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY/FIREBASE_STORAGE_BUCKET not set.");
  }

  console.log("Setup complete. Run `npm run dev` and open /setup to create the first admin.");
  await sql.end();
}

main().catch((err) => {
  console.error("Setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
