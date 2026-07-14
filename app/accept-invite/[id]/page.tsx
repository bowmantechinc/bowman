import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { invitesRepo } from "@/lib/db/invites";
import { rolesRepo } from "@/lib/db/roles";
import { projectsRepo } from "@/lib/db/projects";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Accept invitation · ${SITE_NAME}` };
export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = await invitesRepo.get(id);

  if (!invite || invite.status !== "pending") {
    return (
      <AuthShell title="Invitation not found" description="This invitation link is invalid, already used, or has been revoked.">
        <p className="text-muted-foreground text-sm">
          Ask whoever invited you to send a new invitation from Members.
        </p>
      </AuthShell>
    );
  }

  const [roles, project] = await Promise.all([
    rolesRepo.list(),
    invite.projectId ? projectsRepo.get(invite.projectId) : Promise.resolve(null),
  ]);
  const roleLabel = roles.find((r) => r.id === invite.role)?.label ?? invite.role;

  return (
    <AuthShell
      title={`You've been invited to ${SITE_NAME}`}
      description={
        project
          ? `Join as ${roleLabel} on the "${project.name}" project. Set your name and a password to get started.`
          : `Join as ${roleLabel}. Set your name and a password to get started.`
      }
    >
      <AcceptInviteForm inviteId={invite.id} email={invite.email} />
    </AuthShell>
  );
}
