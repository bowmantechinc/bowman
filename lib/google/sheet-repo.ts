import "server-only";
import { getSheetsApi, getSheetId } from "./sheets-client";

export type Row = Record<string, string>;

export interface TabSchema {
  name: string;
  headers: string[]; // first entry must be "id"
}

function columnLetter(index: number): string {
  // 0-based column index -> spreadsheet column letters (A, B, ..., Z, AA, ...)
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

function rowToObject(row: string[], headers: string[]): Row {
  const obj: Row = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] ?? "";
  });
  return obj;
}

function objectToRow(obj: Row, headers: string[]): string[] {
  return headers.map((h) => obj[h] ?? "");
}

// Cache spreadsheet tab metadata (title -> numeric sheetId/gid) for a short
// window so repeated CRUD calls in one request cycle don't refetch it.
let metaCache: { at: number; sheets: Map<string, number> } | null = null;
const META_TTL_MS = 60_000;

async function getSheetMeta(): Promise<Map<string, number>> {
  if (metaCache && Date.now() - metaCache.at < META_TTL_MS) {
    return metaCache.sheets;
  }
  const sheets = getSheetsApi();
  const res = await sheets.spreadsheets.get({ spreadsheetId: getSheetId() });
  const map = new Map<string, number>();
  for (const sheet of res.data.sheets ?? []) {
    const title = sheet.properties?.title;
    const sheetId = sheet.properties?.sheetId;
    if (title && sheetId !== undefined && sheetId !== null) {
      map.set(title, sheetId);
    }
  }
  metaCache = { at: Date.now(), sheets: map };
  return map;
}

function invalidateMetaCache() {
  metaCache = null;
}

export async function ensureTabs(schemas: TabSchema[]) {
  const sheets = getSheetsApi();
  const spreadsheetId = getSheetId();
  const existing = await getSheetMeta();

  const missing = schemas.filter((s) => !existing.has(s.name));
  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((s) => ({
          addSheet: { properties: { title: s.name } },
        })),
      },
    });
    invalidateMetaCache();
  }

  for (const schema of schemas) {
    const range = `${quoteSheetName(schema.name)}!A1:${columnLetter(schema.headers.length - 1)}1`;
    const current = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const currentHeaders = current.data.values?.[0] ?? [];
    const matches =
      currentHeaders.length === schema.headers.length &&
      schema.headers.every((h, i) => currentHeaders[i] === h);
    if (!matches) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [schema.headers] },
      });
    }
  }
}

export async function listRows(tab: string, headers: string[]): Promise<Row[]> {
  const sheets = getSheetsApi();
  const lastCol = columnLetter(headers.length - 1);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${quoteSheetName(tab)}!A2:${lastCol}`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""))
    .map((r) => rowToObject(r as string[], headers));
}

export async function getRow(tab: string, headers: string[], id: string): Promise<Row | null> {
  const rows = await listRows(tab, headers);
  return rows.find((r) => r.id === id) ?? null;
}

async function findRowNumberById(tab: string, id: string): Promise<number | null> {
  const sheets = getSheetsApi();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${quoteSheetName(tab)}!A2:A`,
  });
  const ids = res.data.values ?? [];
  const idx = ids.findIndex((r) => r[0] === id);
  if (idx === -1) return null;
  return idx + 2; // +1 for header row, +1 for 1-based indexing
}

export async function createRow(tab: string, headers: string[], data: Row): Promise<Row> {
  const sheets = getSheetsApi();
  const lastCol = columnLetter(headers.length - 1);
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${quoteSheetName(tab)}!A1:${lastCol}1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [objectToRow(data, headers)] },
  });
  return data;
}

export async function updateRow(
  tab: string,
  headers: string[],
  id: string,
  patch: Partial<Row>
): Promise<Row> {
  const rowNumber = await findRowNumberById(tab, id);
  if (rowNumber === null) throw new Error(`Row with id "${id}" not found in ${tab}`);
  const existing = await getRow(tab, headers, id);
  const merged: Row = { ...(existing ?? {}), ...patch, id };
  const sheets = getSheetsApi();
  const lastCol = columnLetter(headers.length - 1);
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${quoteSheetName(tab)}!A${rowNumber}:${lastCol}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [objectToRow(merged, headers)] },
  });
  return merged;
}

export async function deleteRow(tab: string, id: string): Promise<void> {
  const rowNumber = await findRowNumberById(tab, id);
  if (rowNumber === null) return;
  const meta = await getSheetMeta();
  const sheetId = meta.get(tab);
  if (sheetId === undefined) throw new Error(`Unknown tab "${tab}"`);
  const sheets = getSheetsApi();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
}

export interface Repo<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function createRepo<T extends { id: string }>(
  schema: TabSchema,
  toItem: (row: Row) => T,
  toRow: (item: Partial<T>) => Row
): Repo<T> {
  return {
    async list() {
      const rows = await listRows(schema.name, schema.headers);
      return rows.map(toItem);
    },
    async get(id) {
      const row = await getRow(schema.name, schema.headers, id);
      return row ? toItem(row) : null;
    },
    async create(item) {
      const row = await createRow(schema.name, schema.headers, toRow(item));
      return toItem(row);
    },
    async update(id, patch) {
      const row = await updateRow(schema.name, schema.headers, id, toRow(patch));
      return toItem(row);
    },
    async remove(id) {
      await deleteRow(schema.name, id);
    },
  };
}
