"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { tasksRepo, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/db/tasks";
import { taskCommentsRepo } from "@/lib/db/taskComments";
import { logActivity } from "@/lib/db/activity";
import type { ActionState } from "./types";

const taskSchema = z.object({
  title: z.string().trim().min(1, { error: "Task title is required." }),
  description: z.string().trim().optional().default(""),
  labelId: z.string().trim().optional().default(""),
  priority: z.enum(TASK_PRIORITIES),
  startDate: z.string().trim().optional().default(""),
  dueDate: z.string().trim().optional().default(""),
  ownerId: z.string().trim().min(1, { error: "Assign this task to someone." }),
  projectId: z.string().trim().min(1, { error: "Choose a project." }),
  status: z.enum(TASK_STATUSES),
});

export async function createTask(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const task = await tasksRepo.create({
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  });

  await logActivity("Plus", `${session.name} created task "${task.title}"`, session.sub);

  revalidatePath("/tasks");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${task.projectId}`);
  return { ok: true };
}

export async function updateTask(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing task id." };

  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await tasksRepo.update(id, parsed.data);
  revalidatePath("/tasks");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

export async function updateTaskStatus(id: string, status: (typeof TASK_STATUSES)[number]): Promise<void> {
  await requireSession();
  await tasksRepo.update(id, { status });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string, projectId: string): Promise<void> {
  await requireSession();
  await tasksRepo.remove(id);
  revalidatePath("/tasks");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
}

const commentSchema = z.object({
  taskId: z.string().trim().min(1),
  text: z.string().trim().min(1, { error: "Write a comment first." }),
});

export async function addTaskComment(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await taskCommentsRepo.create({
    id: crypto.randomUUID(),
    taskId: parsed.data.taskId,
    authorId: session.sub,
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  });

  await logActivity("MessageCircle", `${session.name} commented on a task`, session.sub);

  revalidatePath("/tasks");
  return { ok: true };
}
