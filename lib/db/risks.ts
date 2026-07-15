import "server-only";
import { createRepo, type Row } from "@/lib/db/d1-repo";
import { RISKS_SCHEMA } from "./schema";
import { RISK_LEVELS, type RiskLevel } from "@/lib/constants";

export { RISK_LEVELS };
export type { RiskLevel };

export interface Risk {
  id: string;
  projectId: string;
  description: string;
  category: string;
  likelihood: string;
  impact: string;
  level: RiskLevel;
  ownerId: string;
  mitigation: string;
  createdAt: string;
}

function toItem(row: Row): Risk {
  return {
    id: row.id,
    projectId: row.projectId,
    description: row.description,
    category: row.category,
    likelihood: row.likelihood,
    impact: row.impact,
    level: (row.level as RiskLevel) || "medium",
    ownerId: row.ownerId,
    mitigation: row.mitigation,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Risk>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.projectId !== undefined) row.projectId = item.projectId;
  if (item.description !== undefined) row.description = item.description;
  if (item.category !== undefined) row.category = item.category;
  if (item.likelihood !== undefined) row.likelihood = item.likelihood;
  if (item.impact !== undefined) row.impact = item.impact;
  if (item.level !== undefined) row.level = item.level;
  if (item.ownerId !== undefined) row.ownerId = item.ownerId;
  if (item.mitigation !== undefined) row.mitigation = item.mitigation;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const risksRepo = createRepo<Risk>(RISKS_SCHEMA, toItem, toRow);
