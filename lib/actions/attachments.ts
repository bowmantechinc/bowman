"use server";

import { revalidatePath } from "next/cache";
import { requireSession, isProjectMember } from "@/lib/auth/dal";
import { attachmentsRepo } from "@/lib/db/attachments";
import { projectsRepo } from "@/lib/db/projects";
import { uploadAttachmentFile, deleteAttachmentFile } from "@/lib/r2/storage";
import type { ActionState } from "./types";

const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadAttachment(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const projectId = String(formData.get("projectId") ?? "");
  const file = formData.get("file");

  if (!projectId) return { error: "Missing project." };

  const project = await projectsRepo.get(projectId);
  if (!project || !isProjectMember(project, session)) return { error: "You don't have access to this project." };

  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  if (file.size > MAX_SIZE) return { error: "File is larger than 5 MB." };

  const { storagePath, publicUrl } = await uploadAttachmentFile(file, projectId);

  await attachmentsRepo.create({
    id: crypto.randomUUID(),
    projectId,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    storagePath,
    publicUrl,
    uploadedBy: session.name,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function deleteAttachment(id: string, projectId: string): Promise<void> {
  const session = await requireSession();
  const project = await projectsRepo.get(projectId);
  if (!project || !isProjectMember(project, session)) return;

  const attachment = await attachmentsRepo.get(id);
  if (attachment?.storagePath) await deleteAttachmentFile(attachment.storagePath);
  await attachmentsRepo.remove(id);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/documents");
}
