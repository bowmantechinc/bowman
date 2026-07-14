// Standalone CLI script — deliberately does NOT import the app's
// "server-only"-guarded modules (lib/google/*, lib/db/*). Those guards exist
// to stop credential-handling code from ever being bundled into client-side
// JS by Next.js, but that guard package only works inside Next's bundler and
// throws unconditionally under plain Node/tsx. So this script talks to the
// Sheets API directly instead, duplicating the small bit of schema data it
// needs from lib/db/schema.ts, lib/db/roles.ts, and lib/db/labels.ts.
import { config } from "dotenv";
import path from "node:path";
import { google } from "googleapis";

config({ path: path.resolve(__dirname, "../.env.local") });

interface TabSchema {
  name: string;
  headers: string[];
}

const ALL_SCHEMAS: TabSchema[] = [
  { name: "Members", headers: ["id", "name", "email", "passwordHash", "role", "labelId", "initials", "color", "textColor", "createdAt"] },
  { name: "Roles", headers: ["id", "label"] },
  { name: "Labels", headers: ["id", "name", "color"] },
  { name: "Projects", headers: ["id", "name", "description", "ownerId", "memberIds", "color", "stage", "startDate", "dueDate", "createdAt"] },
  { name: "Tasks", headers: ["id", "title", "description", "labelId", "priority", "startDate", "dueDate", "ownerId", "projectId", "status", "createdAt"] },
  { name: "TaskComments", headers: ["id", "taskId", "authorId", "text", "createdAt"] },
  { name: "Risks", headers: ["id", "projectId", "description", "category", "likelihood", "impact", "level", "ownerId", "mitigation", "createdAt"] },
  { name: "Vendors", headers: ["id", "name", "contact", "email", "licenseStart", "licenseEnd", "supportLevel", "notes"] },
  { name: "Resources", headers: ["id", "name", "icon", "detail", "progress", "color", "label"] },
  { name: "Attachments", headers: ["id", "projectId", "name", "mimeType", "size", "driveFileId", "driveUrl", "uploadedBy", "createdAt"] },
  { name: "Invites", headers: ["id", "email", "role", "labelId", "projectId", "invitedBy", "status", "createdAt"] },
  { name: "Activity", headers: ["id", "icon", "text", "actorId", "createdAt"] },
  { name: "KnowledgeArticles", headers: ["id", "title", "body", "tags", "linkedView", "createdBy", "updatedAt"] },
];

const DEFAULT_ROLES = [
  ["admin", "Admin"],
  ["lead", "Lead"],
  ["member", "Member"],
  ["viewer", "Viewer"],
];

const DEFAULT_LABELS = [
  ["general", "General", "blue"],
  ["design", "Design", "purple"],
  ["engineering", "Engineering", "teal"],
  ["marketing", "Marketing", "amber"],
];

function columnLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function quoteSheetName(name: string) {
  return `'${name.replace(/'/g, "''")}'`;
}

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !rawKey || !sheetId) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_SHEET_ID in .env.local"
    );
  }

  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  console.log("Connecting to spreadsheet...");
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const existingTitles = new Set(meta.data.sheets?.map((s) => s.properties?.title) ?? []);

  const missing = ALL_SCHEMAS.filter((s) => !existingTitles.has(s.name));
  if (missing.length) {
    console.log(`Creating ${missing.length} missing tab(s): ${missing.map((s) => s.name).join(", ")}`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: missing.map((s) => ({ addSheet: { properties: { title: s.name } } })),
      },
    });
  }

  for (const schema of ALL_SCHEMAS) {
    const range = `${quoteSheetName(schema.name)}!A1:${columnLetter(schema.headers.length - 1)}1`;
    const current = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    const currentHeaders = current.data.values?.[0] ?? [];
    const matches =
      currentHeaders.length === schema.headers.length &&
      schema.headers.every((h, i) => currentHeaders[i] === h);
    if (!matches) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [schema.headers] },
      });
    }
  }
  console.log(`Verified headers on all ${ALL_SCHEMAS.length} tabs.`);

  const rolesData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "'Roles'!A2:B" });
  if (!rolesData.data.values?.length) {
    console.log("Seeding default roles...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "'Roles'!A1:B1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: DEFAULT_ROLES },
    });
  }

  const labelsData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "'Labels'!A2:C" });
  if (!labelsData.data.values?.length) {
    console.log("Seeding default labels...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "'Labels'!A1:C1",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: DEFAULT_LABELS },
    });
  }

  console.log("Setup complete. Run `npm run dev` and open /setup to create the first admin.");
}

main().catch((err) => {
  console.error("Setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
