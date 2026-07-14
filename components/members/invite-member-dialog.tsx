"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/auth/submit-button";
import { createInvite } from "@/lib/actions/invites";
import type { Role } from "@/lib/db/roles";
import type { Label as MemberLabel } from "@/lib/db/labels";
import type { Project } from "@/lib/db/projects";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";

export function InviteMemberDialog({
  roles,
  labels,
  projects,
}: {
  roles: Role[];
  labels: MemberLabel[];
  projects: Project[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createInvite, INITIAL_ACTION_STATE);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        <Mail />
        Invite Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            Sends an email with a link to join, set their own password, and (if you pick one) join a project right away.
          </DialogDescription>
        </DialogHeader>

        {state?.ok && state.message ? (
          <div className="space-y-3">
            <div className="bg-emerald-500/10 text-emerald-700 flex items-start gap-2 rounded-md px-3 py-2.5 text-sm dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>{state.message}</span>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            {state?.error && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                <AlertCircle className="size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" name="email" type="email" required placeholder="maria@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite-role">Role</Label>
                <Select name="role" defaultValue={roles.find((r) => r.id === "member")?.id ?? roles[0]?.id}>
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-label">Label</Label>
                <Select name="labelId" defaultValue={labels[0]?.id ?? ""}>
                  <SelectTrigger id="invite-label" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-project">Project (optional)</Label>
              <Select name="projectId" defaultValue="none">
                <SelectTrigger id="invite-project" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project — workspace only</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton className="w-auto">Send invite</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
