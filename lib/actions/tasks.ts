"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { tasksRepo, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/db/tasks";
import { taskCommentsRepo } from "@/lib/db/taskComments";
import { membersRepo } from "@/lib/db/members";
import { logActivity } from "@/lib/db/activity";
import { notifyProjectMembers } from "@/lib/notify";
import type { ActionState } from "./types";

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  inprogress: "In Progress",
  review: "Review",
  done: "Done",
};

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
  progress: z.coerce.number().min(0).max(100).default(0),
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

  try {
    const owner = await membersRepo.get(task.ownerId);
    await notifyProjectMembers({
      projectId: task.projectId,
      actorId: session.sub,
      type: "task_assigned",
      title: "New task assigned",
      body: `${session.name} assigned "${task.title}" to ${owner?.name ?? "a teammate"}`,
      url: `/tasks?project=${task.projectId}`,
      taskId: task.id,
    });
  } catch {
    // Best-effort; the task is already created regardless.
  }

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
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing task id." };

  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await tasksRepo.get(id);
  await tasksRepo.update(id, parsed.data);

  if (existing && existing.ownerId !== parsed.data.ownerId) {
    try {
      const owner = await membersRepo.get(parsed.data.ownerId);
      await notifyProjectMembers({
        projectId: parsed.data.projectId,
        actorId: session.sub,
        type: "task_assigned",
        title: "Task reassigned",
        body: `${session.name} assigned "${parsed.data.title}" to ${owner?.name ?? "a teammate"}`,
        url: `/tasks?project=${parsed.data.projectId}`,
        taskId: id,
      });
    } catch {
      // Best-effort; the task is already updated regardless.
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/timeline");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

export async function updateTaskStatus(id: string, status: (typeof TASK_STATUSES)[number]): Promise<void> {
  const session = await requireSession();
  const existing = await tasksRepo.get(id);
  if (!existing) return;

  await tasksRepo.update(id, status === "done" ? { status, progress: 100 } : { status });

  try {
    await notifyProjectMembers({
      projectId: existing.projectId,
      actorId: session.sub,
      type: "task_status_changed",
      title: "Task status changed",
      body: `${session.name} moved "${existing.title}" to ${STATUS_LABEL[status] ?? status}`,
      url: `/tasks?project=${existing.projectId}`,
      taskId: id,
    });
  } catch {
    // Best-effort; the status is already updated regardless.
  }

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

  const task = await tasksRepo.get(parsed.data.taskId);

  await taskCommentsRepo.create({
    id: crypto.randomUUID(),
    taskId: parsed.data.taskId,
    authorId: session.sub,
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  });

  await logActivity("MessageCircle", `${session.name} commented on a task`, session.sub);

  if (task) {
    try {
      const preview = parsed.data.text.length > 100 ? `${parsed.data.text.slice(0, 100)}…` : parsed.data.text;
      await notifyProjectMembers({
        projectId: task.projectId,
        actorId: session.sub,
        type: "task_comment",
        title: "New comment",
        body: `${session.name} commented on "${task.title}": ${preview}`,
        url: `/tasks?project=${task.projectId}`,
        taskId: task.id,
      });
    } catch {
      // Best-effort; the comment is already saved regardless.
    }
  }

  revalidatePath("/tasks");
  return { ok: true };
}
