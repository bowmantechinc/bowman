import "server-only";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

function getCredentials() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !rawKey || !sheetId) {
    throw new Error(
      "Missing Google service account env vars. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID."
    );
  }

  // Private keys stored in env files keep literal "\n" sequences instead of real newlines.
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  return { email, privateKey, sheetId };
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

export function getSheetId() {
  return getCredentials().sheetId;
}

export function getSheetsApi() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDriveApi() {
  return google.drive({ version: "v3", auth: getAuth() });
}
