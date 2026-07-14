import "server-only";
import { createRepo, type Row } from "@/lib/db/pg-repo";
import { PROJECTS_SCHEMA } from "./schema";
import { toCsv, fromCsv } from "./helpers";
import { PROJECT_STAGES, type ProjectStage } from "@/lib/constants";

export { PROJECT_STAGES };
export type { ProjectStage };

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  color: string;
  stage: ProjectStage;
  startDate: string;
  dueDate: string;
  createdAt: string;
}

function toItem(row: Row): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    memberIds: fromCsv(row.memberIds),
    color: row.color || "blue",
    stage: (row.stage as ProjectStage) || "Planning",
    startDate: row.startDate,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Project>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.name !== undefined) row.name = item.name;
  if (item.description !== undefined) row.description = item.description;
  if (item.ownerId !== undefined) row.ownerId = item.ownerId;
  if (item.memberIds !== undefined) row.memberIds = toCsv(item.memberIds);
  if (item.color !== undefined) row.color = item.color;
  if (item.stage !== undefined) row.stage = item.stage;
  if (item.startDate !== undefined) row.startDate = item.startDate;
  if (item.dueDate !== undefined) row.dueDate = item.dueDate;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const projectsRepo = createRepo<Project>(PROJECTS_SCHEMA, toItem, toRow);
