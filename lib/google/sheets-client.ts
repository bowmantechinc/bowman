import "server-only";
import { google } from "googleapis";

// Only used for Drive (project file attachments) now — structured data lives
// in Postgres (see lib/db/pg-client.ts). Kept as a separate module since it's
// a distinct credential/API surface from the database.
const SCOPES = ["https://www.googleapis.com/auth/drive"];

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Missing Google service account env vars. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY (used for Drive file attachments)."
    );
  }

  // Private keys stored in env files keep literal "\n" sequences instead of real newlines.
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  return { email, privateKey };
}

let authClient: InstanceType<typeof google.auth.JWT> | null = null;

function getAuth() {
  if (authClient) return authClient;
  const { email, privateKey } = getCredentials();
  authClient = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  });
  return authClient;
}

export function getDriveApi() {
  return google.drive({ version: "v3", auth: getAuth() });
}
