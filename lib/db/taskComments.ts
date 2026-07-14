import "server-only";
import { createRepo, type Row } from "@/lib/db/pg-repo";
import { TASK_COMMENTS_SCHEMA } from "./schema";

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

function toItem(row: Row): TaskComment {
  return {
    id: row.id,
    taskId: row.taskId,
    authorId: row.authorId,
    text: row.text,
    createdAt: row.createdAt,
  };
}

function toRow(item: Partial<TaskComment>): Row {
  const row: Row = {};
  if (item.id !== undefined) row.id = item.id;
  if (item.taskId !== undefined) row.taskId = item.taskId;
  if (item.authorId !== undefined) row.authorId = item.authorId;
  if (item.text !== undefined) row.text = item.text;
  if (item.createdAt !== undefined) row.createdAt = item.createdAt;
  return row;
}

export const taskCommentsRepo = createRepo<TaskComment>(TASK_COMMENTS_SCHEMA, toItem, toRow);
