import "server-only";
import { createRepo, type Row } from "@/lib/db/d1-repo";
import { RESOURCES_SCHEMA } from "./schema";
import { toNumber } from "./helpers";

export interface ResourceItem {
  id: string;
  name: string;
  icon: string;
  detail: string;
  progress: number;
  color: string;
  label: string;
}

function toItem(row: Row): ResourceItem {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || "Box",
    detail: row.detail,
    progress: toNumber(row.progress, 0),
    color: row.color || "blue",
    label: row.label,
  };
}

function toRow(item: Partial<ResourceItem>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.name !== undefined) row.name = item.name;
  if (item.icon !== undefined) row.icon = item.icon;
  if (item.detail !== undefined) row.detail = item.detail;
  if (item.progress !== undefined) row.progress = String(item.progress);
  if (item.color !== undefined) row.color = item.color;
  if (item.label !== undefined) row.label = item.label;
  return row;
}

export const resourcesRepo = createRepo<ResourceItem>(RESOURCES_SCHEMA, toItem, toRow);
