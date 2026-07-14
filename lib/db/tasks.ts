import "server-only";
import { createRepo, type Row } from "@/lib/google/sheet-repo";
import { TASKS_SCHEMA } from "./schema";
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus, type TaskPriority } from "@/lib/constants";

export { TASK_STATUSES, TASK_PRIORITIES };
export type { TaskStatus, TaskPriority };

export interface Task {
  id: string;
  title: string;
  description: string;
  labelId: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  ownerId: string;
  projectId: string;
  status: TaskStatus;
  createdAt: string;
}

function toItem(row: Row): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    labelId: row.labelId,
    priority: (row.priority as TaskPriority) || "medium",
    startDate: row.startDate,
    dueDate: row.dueDate,
    ownerId: row.ownerId,
    projectId: row.projectId,
    status: (row.status as TaskStatus) || "backlog",
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<Task>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.title !== undefined) row.title = item.title;
  if (item.description !== undefined) row.description = item.description;
  if (item.labelId !== undefined) row.labelId = item.labelId;
  if (item.priority !== undefined) row.priority = item.priority;
  if (item.startDate !== undefined) row.startDate = item.startDate;
  if (item.dueDate !== undefined) row.dueDate = item.dueDate;
  if (item.ownerId !== undefined) row.ownerId = item.ownerId;
  if (item.projectId !== undefined) row.projectId = item.projectId;
  if (item.status !== undefined) row.status = item.status;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const tasksRepo = createRepo<Task>(TASKS_SCHEMA, toItem, toRow);
