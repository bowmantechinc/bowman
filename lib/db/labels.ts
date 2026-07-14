import "server-only";
import { createRepo, type Row } from "@/lib/google/sheet-repo";
import { LABELS_SCHEMA } from "./schema";

export interface Label {
  id: string;
  name: string;
  color: string;
}

function toItem(row: Row): Label {
  return { id: row.id, name: row.name, color: row.color };
}

function toRow(item: Partial<Label>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.name !== undefined) row.name = item.name;
  if (item.color !== undefined) row.color = item.color;
  return row;
}

export const labelsRepo = createRepo<Label>(LABELS_SCHEMA, toItem, toRow);

export const DEFAULT_LABELS: Label[] = [
  { id: "general", name: "General", color: "blue" },
  { id: "design", name: "Design", color: "purple" },
  { id: "engineering", name: "Engineering", color: "teal" },
  { id: "marketing", name: "Marketing", color: "amber" },
];
