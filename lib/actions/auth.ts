"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { membersRepo, getMemberByEmail, initialsFromName, pickAvatarColor } from "@/lib/db/members";
import { rolesRepo, DEFAULT_ROLES } from "@/lib/db/roles";
import { labelsRepo, DEFAULT_LABELS } from "@/lib/db/labels";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { logActivity } from "@/lib/db/activity";

export interface AuthFormState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().trim().min(1, { error: "Email is required." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export async function loginAction(
  _prevState: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const member = await getMemberByEmail(parsed.data.email);
  if (!member) return { error: "Incorrect email or password." };

  const ok = await verifyPassword(parsed.data.password, member.passwordHash);
  if (!ok) return { error: "Incorrect email or password." };

  await setSessionCookie({
    sub: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

const bootstrapSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(6, { error: "Password must be at least 6 characters." }),
});

export async function bootstrapAction(
  _prevState: AuthFormState | undefined,
  formData: FormData
): Promise<AuthFormState> {
  const existing = await membersRepo.list();
  if (existing.length > 0) {
    return { error: "Setup has already been completed. Sign in instead." };
  }

  const parsed = bootstrapSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const roles = await rolesRepo.list();
  if (roles.length === 0) {
    for (const role of DEFAULT_ROLES) await rolesRepo.create(role);
  }
  const labels = await labelsRepo.list();
  if (labels.length === 0) {
    for (const label of DEFAULT_LABELS) await labelsRepo.create(label);
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const [color, textColor] = pickAvatarColor(0);

  const admin = await membersRepo.create({
    id,
    name,
    email,
    passwordHash,
    role: "admin",
    labelId: "",
    initials: initialsFromName(name),
    color,
    textColor,
    createdAt: new Date().toISOString(),
  });

  await logActivity("UserPlus", `${admin.name} created the workspace`, admin.id);

  await setSessionCookie({
    sub: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });

  redirect("/dashboard");
}
