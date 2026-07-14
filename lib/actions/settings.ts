"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { rolesRepo } from "@/lib/db/roles";
import { labelsRepo } from "@/lib/db/labels";
import { membersRepo } from "@/lib/db/members";
import type { ActionState } from "./types";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export async function addRole(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Role name is required." };

  const id = slugify(label) || `role-${crypto.randomUUID().slice(0, 6)}`;
  const roles = await rolesRepo.list();
  if (roles.some((r) => r.id === id)) return { error: "That role already exists." };

  await rolesRepo.create({ id, label });
  revalidatePath("/settings");
  return { ok: true };
}

export async function removeRole(id: string): Promise<void> {
  await requireAdmin();
  const [roles, members] = await Promise.all([rolesRepo.list(), membersRepo.list()]);
  if (roles.length <= 1) return;
  if (members.some((m) => m.role === id)) return;
  await rolesRepo.remove(id);
  revalidatePath("/settings");
}

export async function addLabel(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Label name is required." };

  const id = slugify(name) || `label-${crypto.randomUUID().slice(0, 6)}`;
  const labels = await labelsRepo.list();
  if (labels.some((l) => l.id === id)) return { error: "That label already exists." };

  const palette = ["blue", "purple", "teal", "amber", "coral", "green"];
  await labelsRepo.create({ id, name, color: palette[labels.length % palette.length] });
  revalidatePath("/settings");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function removeLabel(id: string): Promise<void> {
  await requireAdmin();
  const [labels, members] = await Promise.all([labelsRepo.list(), membersRepo.list()]);
  if (labels.length <= 1) return;
  if (members.some((m) => m.labelId === id)) return;
  await labelsRepo.remove(id);
  revalidatePath("/settings");
  revalidatePath("/tasks");
}
