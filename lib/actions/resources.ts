"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { resourcesRepo } from "@/lib/db/resources";
import type { ActionState } from "./types";

const resourceSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  icon: z.string().trim().optional().default("Box"),
  detail: z.string().trim().optional().default(""),
  progress: z.coerce.number().min(0).max(100).default(0),
  color: z.string().trim().optional().default("blue"),
  label: z.string().trim().optional().default(""),
});

export async function createResource(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const parsed = resourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await resourcesRepo.create({ id: crypto.randomUUID(), ...parsed.data });
  revalidatePath("/resources");
  return { ok: true };
}

export async function updateResource(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing resource id." };

  const parsed = resourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await resourcesRepo.update(id, parsed.data);
  revalidatePath("/resources");
  return { ok: true };
}

export async function deleteResource(id: string): Promise<void> {
  await requireSession();
  await resourcesRepo.remove(id);
  revalidatePath("/resources");
}
