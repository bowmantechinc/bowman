import "server-only";
import { getDb } from "./d1-client";

export type Row = Record<string, string>;

export interface TableSchema {
  name: string; // table name
  headers: string[]; // column names; first entry must be "id"
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function rowToObject(row: Record<string, unknown>, headers: string[]): Row {
  const obj: Row = {};
  headers.forEach((h) => {
    const v = row[h];
    obj[h] = v === null || v === undefined ? "" : String(v);
  });
  return obj;
}

// Short-lived, write-invalidated cache so a page that reads the same table
// multiple times in one render (or across a couple of nearby requests)
// doesn't round-trip to D1 each time.
const rowsCache = new Map<string, { at: number; rows: Row[] }>();
const ROWS_CACHE_TTL_MS = 10_000;

function invalidateRowsCache(tab: string) {
  rowsCache.delete(tab);
}

export async function listRows(tab: string, headers: string[]): Promise<Row[]> {
  const cached = rowsCache.get(tab);
  if (cached && Date.now() - cached.at < ROWS_CACHE_TTL_MS) {
    return cached.rows;
  }
  const db = await getDb();
  const colList = headers.map(quoteIdent).join(", ");
  const result = await db.prepare(`SELECT ${colList} FROM ${quoteIdent(tab)} ORDER BY _seq`).all();
  const rows = result.results.map((r) => rowToObject(r as Record<string, unknown>, headers));
  rowsCache.set(tab, { at: Date.now(), rows });
  return rows;
}

export async function getRow(tab: string, headers: string[], id: string): Promise<Row | null> {
  const db = await getDb();
  const colList = headers.map(quoteIdent).join(", ");
  const result = await db
    .prepare(`SELECT ${colList} FROM ${quoteIdent(tab)} WHERE ${quoteIdent(headers[0])} = ?`)
    .bind(id)
    .first();
  if (!result) return null;
  return rowToObject(result as Record<string, unknown>, headers);
}

export async function createRow(tab: string, headers: string[], data: Row): Promise<Row> {
  const db = await getDb();
  const cols = headers.map(quoteIdent).join(", ");
  const placeholders = headers.map(() => "?").join(", ");
  const params = headers.map((h) => data[h] ?? "");
  await db
    .prepare(`INSERT INTO ${quoteIdent(tab)} (${cols}) VALUES (${placeholders})`)
    .bind(...params)
    .run();
  invalidateRowsCache(tab);
  return data;
}

export async function updateRow(
  tab: string,
  headers: string[],
  id: string,
  patch: Partial<Row>
): Promise<Row> {
  const existing = await getRow(tab, headers, id);
  if (!existing) throw new Error(`Row with id "${id}" not found in ${tab}`);
  const merged: Row = { ...existing, ...patch, id };
  const db = await getDb();
  const otherHeaders = headers.filter((h) => h !== headers[0]);
  const setClauses = otherHeaders.map((h) => `${quoteIdent(h)} = ?`).join(", ");
  const params = [...otherHeaders.map((h) => merged[h] ?? ""), id];
  await db
    .prepare(`UPDATE ${quoteIdent(tab)} SET ${setClauses} WHERE ${quoteIdent(headers[0])} = ?`)
    .bind(...params)
    .run();
  invalidateRowsCache(tab);
  return merged;
}

export async function deleteRow(tab: string, id: string): Promise<void> {
  const db = await getDb();
  await db.prepare(`DELETE FROM ${quoteIdent(tab)} WHERE "id" = ?`).bind(id).run();
  invalidateRowsCache(tab);
}

export interface Repo<T extends { id: string }> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function createRepo<T extends { id: string }>(
  schema: TableSchema,
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
