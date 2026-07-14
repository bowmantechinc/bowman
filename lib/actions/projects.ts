"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession, isManager } from "@/lib/auth/dal";
import { projectsRepo, PROJECT_STAGES } from "@/lib/db/projects";
import { logActivity } from "@/lib/db/activity";
import type { ActionState } from "./types";

const PALETTE = ["blue", "purple", "teal", "amber", "coral", "green"];

const projectSchema = z.object({
  name: z.string().trim().min(1, { error: "Project name is required." }),
  description: z.string().trim().optional().default(""),
  ownerId: z.string().trim().min(1, { error: "Choose an owner." }),
  stage: z.enum(PROJECT_STAGES, { error: "Choose a valid stage." }),
  startDate: z.string().trim().optional().default(""),
  dueDate: z.string().trim().optional().default(""),
});

export async function createProject(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!isManager(session.role)) return { error: "Only admins and leads can create projects." };

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { name, description, ownerId, stage, startDate, dueDate } = parsed.data;
  await projectsRepo.create({
    id: crypto.randomUUID(),
    name,
    description,
    ownerId,
    memberIds: [ownerId, session.sub].filter((v, i, arr) => arr.indexOf(v) === i),
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    stage,
    startDate,
    dueDate,
    createdAt: new Date().toISOString(),
  });

  await logActivity("Plus", `${session.name} created project "${name}"`, session.sub);

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateProject(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!isManager(session.role)) return { error: "Only admins and leads can edit projects." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing project id." };

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await projectsRepo.update(id, parsed.data);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManager(session.role)) return;
  await projectsRepo.remove(id);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function addProjectMember(projectId: string, memberId: string): Promise<void> {
  const session = await requireSession();
  const project = await projectsRepo.get(projectId);
  if (!project) return;
  if (!project.memberIds.includes(memberId)) {
    await projectsRepo.update(projectId, { memberIds: [...project.memberIds, memberId] });
    await logActivity("UserPlus", `${session.name} added a member to "${project.name}"`, session.sub);
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<void> {
  await requireSession();
  const project = await projectsRepo.get(projectId);
  if (!project) return;
  await projectsRepo.update(projectId, {
    memberIds: project.memberIds.filter((id) => id !== memberId),
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectMemberFromForm(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!projectId || !memberId) return;
  await addProjectMember(projectId, memberId);
}
