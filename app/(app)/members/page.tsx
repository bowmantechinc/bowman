import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { InlineSelectAction } from "@/components/inline-select-action";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { changeMemberRole, changeMemberLabel, deleteMember } from "@/lib/actions/members";
import { membersRepo } from "@/lib/db/members";
import { rolesRepo } from "@/lib/db/roles";
import { labelsRepo } from "@/lib/db/labels";
import { tasksRepo } from "@/lib/db/tasks";
import { getSession } from "@/lib/auth/session";
import { isManager } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Members" };

const ROLE_TONE: Record<string, "purple" | "blue" | "gray" | "green"> = {
  admin: "purple",
  lead: "blue",
};

export default async function MembersPage() {
  const [members, roles, labels, tasks, session] = await Promise.all([
    membersRepo.list(),
    rolesRepo.list(),
    labelsRepo.list(),
    tasksRepo.list(),
    getSession(),
  ]);

  const canManage = session ? isManager(session.role) : false;
  const isAdmin = session?.role === "admin";
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.label }));
  const labelOptions = labels.map((l) => ({ value: l.id, label: l.name }));

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${members.length} member${members.length === 1 ? "" : "s"}`}
        actions={canManage && <MemberFormDialog roles={roles} labels={labels} />}
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
    </div>
  );
}
