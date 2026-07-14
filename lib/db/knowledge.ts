import "server-only";
import { createRepo, type Row } from "@/lib/db/pg-repo";
import { KNOWLEDGE_SCHEMA } from "./schema";
import { toCsv, fromCsv } from "./helpers";

export interface KnowledgeArticle {
  id: string;
  title: string;
  body: string;
  tags: string[];
  linkedView: string;
  createdBy: string;
  updatedAt: string;
}

function toItem(row: Row): KnowledgeArticle {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: fromCsv(row.tags),
    linkedView: row.linkedView,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
  };
}

function toRow(item: Partial<KnowledgeArticle>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.title !== undefined) row.title = item.title;
  if (item.body !== undefined) row.body = item.body;
  if (item.tags !== undefined) row.tags = toCsv(item.tags);
  if (item.linkedView !== undefined) row.linkedView = item.linkedView;
  if (item.createdBy !== undefined) row.createdBy = item.createdBy;
  if (item.updatedAt !== undefined) row.updatedAt = item.updatedAt;
  return row;
}

export const knowledgeRepo = createRepo<KnowledgeArticle>(KNOWLEDGE_SCHEMA, toItem, toRow);
