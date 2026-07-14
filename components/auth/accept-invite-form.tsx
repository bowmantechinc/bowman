"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { acceptInvite } from "@/lib/actions/invites";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";

export function AcceptInviteForm({ inviteId, email }: { inviteId: string; email: string }) {
  const [state, action] = useActionState(acceptInvite, INITIAL_ACTION_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="inviteId" value={inviteId} />
      {state?.error && (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required placeholder="e.g. Maria Santos" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Choose a password</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      <SubmitButton>Accept invitation & sign in</SubmitButton>
    </form>
  );
}
