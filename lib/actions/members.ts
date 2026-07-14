"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireSession, requireAdmin, isManager } from "@/lib/auth/dal";
import { membersRepo, getMemberByEmail, initialsFromName, pickAvatarColor } from "@/lib/db/members";
import { tasksRepo } from "@/lib/db/tasks";
import { hashPassword } from "@/lib/auth/password";
import { logActivity } from "@/lib/db/activity";
import type { ActionState } from "./types";

function generateTempPassword() {
  return `Welcome-${crypto.randomUUID().slice(0, 8)}`;
}

const memberSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  role: z.string().trim().min(1, { error: "Choose a role." }),
  labelId: z.string().trim().optional().default(""),
});

export async function createMember(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!isManager(session.role)) return { error: "Only admins and leads can add members." };

  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await getMemberByEmail(parsed.data.email);
  if (existing) return { error: "A member with this email already exists." };

  const all = await membersRepo.list();
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const [color, textColor] = pickAvatarColor(all.length);

  const member = await membersRepo.create({
    id: crypto.randomUUID(),
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    labelId: parsed.data.labelId,
    initials: initialsFromName(parsed.data.name),
    color,
    textColor,
    createdAt: new Date().toISOString(),
  });

  await logActivity("UserPlus", `${session.name} added ${member.name} (${member.role})`, session.sub);

  revalidatePath("/members");
  revalidatePath("/settings");
  return { ok: true, message: `Account created. Temporary password: ${tempPassword}` };
}

export async function updateMember(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!isManager(session.role)) return { error: "Only admins and leads can edit members." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing member id." };

  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const newPassword = String(formData.get("password") ?? "").trim();
  const patch: Record<string, string> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    labelId: parsed.data.labelId,
    initials: initialsFromName(parsed.data.name),
  };
  if (newPassword) patch.passwordHash = await hashPassword(newPassword);

  await membersRepo.update(id, patch);
  revalidatePath("/members");
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteMember(id: string): Promise<void> {
  await requireAdmin();
  await membersRepo.remove(id);
  const tasks = await tasksRepo.list();
  await Promise.all(
    tasks.filter((t) => t.ownerId === id).map((t) => tasksRepo.update(t.id, { ownerId: "" }))
  );
  revalidatePath("/members");
  revalidatePath("/settings");
  revalidatePath("/tasks");
}

export async function changeMemberRole(memberId: string, role: string): Promise<void> {
  await requireAdmin();
  await membersRepo.update(memberId, { role });
  revalidatePath("/members");
  revalidatePath("/settings");
}

export async function changeMemberLabel(memberId: string, labelId: string): Promise<void> {
  await requireAdmin();
  await membersRepo.update(memberId, { labelId });
  revalidatePath("/members");
  revalidatePath("/settings");
}
