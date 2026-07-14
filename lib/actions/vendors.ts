"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { vendorsRepo } from "@/lib/db/vendors";
import type { ActionState } from "./types";

const vendorSchema = z.object({
  name: z.string().trim().min(1, { error: "Vendor name is required." }),
  contact: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  licenseStart: z.string().trim().optional().default(""),
  licenseEnd: z.string().trim().optional().default(""),
  supportLevel: z.string().trim().optional().default("Standard"),
  notes: z.string().trim().optional().default(""),
});

export async function createVendor(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await vendorsRepo.create({ id: crypto.randomUUID(), ...parsed.data });
  revalidatePath("/vendors");
  return { ok: true };
}

export async function updateVendor(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing vendor id." };

  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await vendorsRepo.update(id, parsed.data);
  revalidatePath("/vendors");
  return { ok: true };
}

export async function deleteVendor(id: string): Promise<void> {
  await requireSession();
  await vendorsRepo.remove(id);
  revalidatePath("/vendors");
}
