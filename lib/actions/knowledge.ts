"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { knowledgeRepo } from "@/lib/db/knowledge";
import { NO_LINKED_VIEW } from "@/lib/constants";
import type { ActionState } from "./types";

const articleSchema = z.object({
  title: z.string().trim().min(1, { error: "Title is required." }),
  body: z.string().trim().optional().default(""),
  tags: z.string().trim().optional().default(""),
  linkedView: z.string().trim().optional().default(NO_LINKED_VIEW),
});

function normalizeLinkedView(value: string): string {
  return value === NO_LINKED_VIEW ? "" : value;
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createArticle(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = articleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await knowledgeRepo.create({
    id: crypto.randomUUID(),
    title: parsed.data.title,
    body: parsed.data.body,
    tags: parseTags(parsed.data.tags),
    linkedView: normalizeLinkedView(parsed.data.linkedView),
    createdBy: session.name,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/knowledge");
  return { ok: true };
}

export async function updateArticle(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing article id." };

  const parsed = articleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await knowledgeRepo.update(id, {
    title: parsed.data.title,
    body: parsed.data.body,
    tags: parseTags(parsed.data.tags),
    linkedView: normalizeLinkedView(parsed.data.linkedView),
    updatedAt: new Date().toISOString(),
  });

  revalidatePath("/knowledge");
  return { ok: true };
}

export async function deleteArticle(id: string): Promise<void> {
  await requireSession();
  await knowledgeRepo.remove(id);
  revalidatePath("/knowledge");
}
