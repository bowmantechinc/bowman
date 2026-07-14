"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession, isManager } from "@/lib/auth/dal";
import { invitesRepo } from "@/lib/db/invites";
import { membersRepo, getMemberByEmail, initialsFromName, pickAvatarColor } from "@/lib/db/members";
import { projectsRepo } from "@/lib/db/projects";
import { rolesRepo } from "@/lib/db/roles";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { sendInviteEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/site";
import { logActivity } from "@/lib/db/activity";
import type { ActionState } from "./types";

const NO_PROJECT = "none";

const inviteSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  role: z.string().trim().min(1, { error: "Choose a role." }),
  labelId: z.string().trim().optional().default(""),
  projectId: z.string().trim().optional().default(NO_PROJECT),
});

export async function createInvite(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();
  if (!isManager(session.role)) return { error: "Only admins and leads can invite members." };

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const email = parsed.data.email.toLowerCase();
  const projectId = parsed.data.projectId === NO_PROJECT ? "" : parsed.data.projectId;

  const existingMember = await getMemberByEmail(email);
  if (existingMember) return { error: "This person is already a member." };

  const existingInvites = await invitesRepo.list();
  if (existingInvites.some((i) => i.email.toLowerCase() === email && i.status === "pending")) {
    return { error: "There's already a pending invite for this email." };
  }

  const [project, roles] = await Promise.all([
    projectId ? projectsRepo.get(projectId) : Promise.resolve(null),
    rolesRepo.list(),
  ]);
  const roleLabel = roles.find((r) => r.id === parsed.data.role)?.label ?? parsed.data.role;

  const invite = await invitesRepo.create({
    id: crypto.randomUUID(),
    email,
    role: parsed.data.role,
    labelId: parsed.data.labelId,
    projectId,
    invitedBy: session.name,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  const acceptUrl = `${getAppUrl()}/accept-invite/${invite.id}`;

  try {
    await sendInviteEmail({
      to: invite.email,
      inviterName: session.name,
      roleLabel,
      projectName: project?.name,
      acceptUrl,
    });
  } catch (err) {
    revalidatePath("/members");
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      ok: true,
      message: `Invite created, but the email failed to send (${message}). Share this link with them directly: ${acceptUrl}`,
    };
  }

  await logActivity("UserPlus", `${session.name} invited ${invite.email}`, session.sub);

  revalidatePath("/members");
  return { ok: true, message: `Invitation sent to ${invite.email}.` };
}

export async function resendInvite(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManager(session.role)) return;

  const invite = await invitesRepo.get(id);
  if (!invite || invite.status !== "pending") return;

  const [project, roles] = await Promise.all([
    invite.projectId ? projectsRepo.get(invite.projectId) : Promise.resolve(null),
    rolesRepo.list(),
  ]);
  const roleLabel = roles.find((r) => r.id === invite.role)?.label ?? invite.role;
  const acceptUrl = `${getAppUrl()}/accept-invite/${invite.id}`;

  try {
    await sendInviteEmail({
      to: invite.email,
      inviterName: session.name,
      roleLabel,
      projectName: project?.name,
      acceptUrl,
    });
  } catch {
    // Best-effort resend; the invite link keeps working regardless.
  }
  revalidatePath("/members");
}

export async function revokeInvite(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManager(session.role)) return;
  await invitesRepo.update(id, { status: "revoked" });
  revalidatePath("/members");
}

const acceptSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  password: z.string().min(6, { error: "Password must be at least 6 characters." }),
});

export async function acceptInvite(
  _prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const inviteId = String(formData.get("inviteId") ?? "");
  const invite = await invitesRepo.get(inviteId);
  if (!invite || invite.status !== "pending") {
    return { error: "This invitation is no longer valid." };
  }

  const parsed = acceptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const existing = await getMemberByEmail(invite.email);
  if (existing) {
    await invitesRepo.update(invite.id, { status: "accepted" });
    return { error: "An account already exists for this email — sign in instead." };
  }

  const all = await membersRepo.list();
  const passwordHash = await hashPassword(parsed.data.password);
  const [color, textColor] = pickAvatarColor(all.length);

  const member = await membersRepo.create({
    id: crypto.randomUUID(),
    name: parsed.data.name,
    email: invite.email,
    passwordHash,
    role: invite.role,
    labelId: invite.labelId,
    initials: initialsFromName(parsed.data.name),
    color,
    textColor,
    createdAt: new Date().toISOString(),
  });

  if (invite.projectId) {
    const project = await projectsRepo.get(invite.projectId);
    if (project && !project.memberIds.includes(member.id)) {
      await projectsRepo.update(project.id, { memberIds: [...project.memberIds, member.id] });
    }
  }

  await invitesRepo.update(invite.id, { status: "accepted" });
  await logActivity("UserCheck", `${member.name} joined the workspace`, member.id);

  await setSessionCookie({ sub: member.id, name: member.name, email: member.email, role: member.role });
  redirect("/dashboard");
}
