import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { InlineSelectAction } from "@/components/inline-select-action";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { changeMemberRole, changeMemberLabel, deleteMember } from "@/lib/actions/members";
import { resendInvite, revokeInvite } from "@/lib/actions/invites";
import { membersRepo } from "@/lib/db/members";
import { rolesRepo } from "@/lib/db/roles";
import { labelsRepo } from "@/lib/db/labels";
import { tasksRepo } from "@/lib/db/tasks";
import { invitesRepo } from "@/lib/db/invites";
import { projectsRepo } from "@/lib/db/projects";
import { getSession } from "@/lib/auth/session";
import { isManager } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Members" };

const ROLE_TONE: Record<string, "purple" | "blue" | "gray" | "green"> = {
  admin: "purple",
  lead: "blue",
};

const INVITE_STATUS_TONE: Record<string, "amber" | "green" | "red" | "gray"> = {
  pending: "amber",
  accepted: "green",
  revoked: "red",
};

const INVITE_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Activated",
  revoked: "Revoked",
};

function formatLastLogin(iso: string): string {
  if (!iso) return "Never logged in";
  return `Last login ${new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
}

export default async function MembersPage() {
  const [members, roles, labels, tasks, invites, projects, session] = await Promise.all([
    membersRepo.list(),
    rolesRepo.list(),
    labelsRepo.list(),
    tasksRepo.list(),
    invitesRepo.list(),
    projectsRepo.list(),
    getSession(),
  ]);

  const canManage = session ? isManager(session.role) : false;
  const isAdmin = session?.role === "admin";
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.label }));
  const labelOptions = labels.map((l) => ({ value: l.id, label: l.name }));
  const sortedInvites = invites.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${members.length} member${members.length === 1 ? "" : "s"}`}
        actions={
          canManage && (
            <>
              <InviteMemberDialog roles={roles} labels={labels} projects={projects} />
              <MemberFormDialog roles={roles} labels={labels} />
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const mTasks = tasks.filter((t) => t.ownerId === m.id);
          const open = mTasks.filter((t) => t.status !== "done").length;
          const done = mTasks.filter((t) => t.status === "done").length;
          const label = labels.find((l) => l.id === m.labelId);
          const roleLabel = roles.find((r) => r.id === m.role)?.label ?? m.role;

          return (
            <Card key={m.id}>
              <CardContent>
                <div className="mb-3 flex items-center gap-3">
                  <MemberAvatar name={m.name} initials={m.initials} color={m.color} textColor={m.textColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{m.name}</div>
                    <div className="text-muted-foreground truncate text-xs">{m.email}</div>
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-1.5">
                  <ToneBadge tone={ROLE_TONE[m.role] ?? "gray"}>{roleLabel}</ToneBadge>
                  {label && <ToneBadge tone="gray">{label.name}</ToneBadge>}
                </div>
                <div className="text-muted-foreground mb-3 text-[11px]">{formatLastLogin(m.lastLoginAt)}</div>
                <div className="mb-3 flex gap-4 text-center text-sm">
                  <div className="flex-1">
                    <div className="font-semibold">{mTasks.length}</div>
                    <div className="text-muted-foreground text-[11px]">Total</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{open}</div>
                    <div className="text-muted-foreground text-[11px]">Open</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{done}</div>
                    <div className="text-muted-foreground text-[11px]">Done</div>
                  </div>
                </div>
                {isAdmin && session?.sub !== m.id ? (
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex gap-2">
                      <InlineSelectAction
                        value={m.role}
                        options={roleOptions}
                        action={changeMemberRole.bind(null, m.id)}
                        className="flex-1"
                      />
                      <InlineSelectAction
                        value={m.labelId}
                        options={labelOptions}
                        action={changeMemberLabel.bind(null, m.id)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <MemberFormDialog roles={roles} labels={labels} member={m} />
                      <ConfirmDeleteButton action={deleteMember.bind(null, m.id)} confirmMessage="Delete this member? Their tasks will be unassigned." />
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground border-t pt-3 text-xs">
                    {session?.sub === m.id ? "This is you" : "—"}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {canManage && (
        <div className="mt-8">
          <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-wide uppercase">
            Invitations
          </h2>
          {sortedInvites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invitations sent yet.</p>
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Invited by</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvites.map((inv) => {
                    const roleLabel = roles.find((r) => r.id === inv.role)?.label ?? inv.role;
                    const project = projects.find((p) => p.id === inv.projectId);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell>
                          <ToneBadge tone="gray">{roleLabel}</ToneBadge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{project?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.invitedBy}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <ToneBadge tone={INVITE_STATUS_TONE[inv.status] ?? "gray"}>
                            {INVITE_STATUS_LABEL[inv.status] ?? inv.status}
                          </ToneBadge>
                        </TableCell>
                        <TableCell>
                          {inv.status === "pending" && (
                            <div className="flex justify-end gap-1.5">
                              <form action={resendInvite.bind(null, inv.id)}>
                                <Button type="submit" variant="outline" size="icon-sm" title="Resend email">
                                  <RotateCw className="size-3.5" />
                                </Button>
                              </form>
                              <ConfirmDeleteButton
                                action={revokeInvite.bind(null, inv.id)}
                                confirmMessage="Revoke this invitation?"
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
