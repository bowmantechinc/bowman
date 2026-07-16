"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/auth/submit-button";
import { createRisk, updateRisk } from "@/lib/actions/risks";
import { RISK_LEVELS } from "@/lib/constants";
import type { Risk } from "@/lib/db/risks";
import type { Project } from "@/lib/db/projects";
import type { Member } from "@/lib/db/members";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

const LIKELIHOOD_OPTIONS = ["Low", "Medium", "High"];

export function RiskFormDialog({
  members,
  projects,
  risk,
  defaultProjectId,
}: {
  members: Member[];
  projects: Project[];
  risk?: Risk;
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const action = risk ? updateRisk : createRisk;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={risk ? "Edit risk" : undefined}
        className={buttonVariants({ variant: risk ? "outline" : "default", size: risk ? "icon-sm" : "sm" })}
      >
        {risk ? <Pencil /> : <><Plus /> New Risk</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{risk ? "Edit risk" : "Log a new risk"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {risk && <input type="hidden" name="id" value={risk.id} />}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="description">Risk description</Label>
            <Textarea id="description" name="description" required defaultValue={risk?.description} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project</Label>
              <Select name="projectId" defaultValue={risk?.projectId ?? defaultProjectId ?? projects[0]?.id}>
                <SelectTrigger id="projectId" className="w-full">
                  <SelectValue>{(id: string) => projects.find((p) => p.id === id)?.name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue={risk?.category} placeholder="e.g. Schedule" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="likelihood">Likelihood</Label>
              <Select name="likelihood" defaultValue={risk?.likelihood ?? "Medium"}>
                <SelectTrigger id="likelihood" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIKELIHOOD_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="impact">Impact</Label>
              <Select name="impact" defaultValue={risk?.impact ?? "High"}>
                <SelectTrigger id="impact" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIKELIHOOD_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">Level</Label>
              <Select name="level" defaultValue={risk?.level ?? "medium"}>
                <SelectTrigger id="level" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((l) => (
                    <SelectItem key={l} value={l} className="capitalize">
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ownerId">Owner</Label>
            <Select name="ownerId" defaultValue={risk?.ownerId ?? members[0]?.id}>
              <SelectTrigger id="ownerId" className="w-full">
                <SelectValue>{(id: string) => members.find((m) => m.id === id)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mitigation">Mitigation</Label>
            <Textarea id="mitigation" name="mitigation" defaultValue={risk?.mitigation} placeholder="Plan / next steps" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-auto">{risk ? "Save changes" : "Add risk"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
