"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { risksRepo, RISK_LEVELS } from "@/lib/db/risks";
import type { ActionState } from "./types";

const riskSchema = z.object({
  projectId: z.string().trim().min(1, { error: "Choose a project." }),
  description: z.string().trim().min(1, { error: "Describe the risk." }),
  category: z.string().trim().optional().default("General"),
  likelihood: z.string().trim().min(1),
  impact: z.string().trim().min(1),
  level: z.enum(RISK_LEVELS),
  ownerId: z.string().trim().min(1, { error: "Choose an owner." }),
  mitigation: z.string().trim().optional().default(""),
});

export async function createRisk(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const parsed = riskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await risksRepo.create({
    id: crypto.randomUUID(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/risks");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

export async function updateRisk(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing risk id." };

  const parsed = riskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await risksRepo.update(id, parsed.data);
  revalidatePath("/risks");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}

export async function deleteRisk(id: string): Promise<void> {
  await requireSession();
  await risksRepo.remove(id);
  revalidatePath("/risks");
  revalidatePath("/dashboard");
}
