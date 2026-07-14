"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Pencil, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { createMember, updateMember } from "@/lib/actions/members";
import type { Member } from "@/lib/db/members";
import type { Role } from "@/lib/db/roles";
import type { Label as MemberLabel } from "@/lib/db/labels";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

export function MemberFormDialog({
  roles,
  labels,
  member,
}: {
  roles: Role[];
  labels: MemberLabel[];
  member?: Member;
}) {
  const [open, setOpen] = useState(false);
  const action = member ? updateMember : createMember;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen, (s) => !!s.ok && !!member);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <DialogTrigger
        aria-label={member ? "Edit member" : undefined}
        className={buttonVariants({ variant: member ? "outline" : "default", size: member ? "icon-sm" : "sm" })}
      >
        {member ? <Pencil /> : <><UserPlus /> Add Member</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Edit member" : "Add a team member"}</DialogTitle>
        </DialogHeader>

        {state?.ok && state.message ? (
          <div className="space-y-3">
            <div className="bg-emerald-500/10 text-emerald-700 flex items-start gap-2 rounded-md px-3 py-2.5 text-sm dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>{state.message} Share this with them — it won&apos;t be shown again.</span>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            {member && <input type="hidden" name="id" value={member.id} />}
            {state?.error && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
                <AlertCircle className="size-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required defaultValue={member?.name} placeholder="e.g. Maria Santos" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required defaultValue={member?.email} placeholder="maria@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={member?.role ?? roles.find((r) => r.id === "member")?.id ?? roles[0]?.id}>
                  <SelectTrigger id="role" className="w-full">
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
                <Label htmlFor="labelId">Label</Label>
                <Select name="labelId" defaultValue={member?.labelId ?? labels[0]?.id ?? ""}>
                  <SelectTrigger id="labelId" className="w-full">
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
            {member && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Reset password</Label>
                <Input id="password" name="password" placeholder="Leave blank to keep current" />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton className="w-auto">{member ? "Save changes" : "Add member"}</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
