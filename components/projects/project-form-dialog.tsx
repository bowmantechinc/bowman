"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/auth/submit-button";
import { createProject, updateProject } from "@/lib/actions/projects";
import { PROJECT_STAGES } from "@/lib/constants";
import type { Project } from "@/lib/db/projects";
import type { Member } from "@/lib/db/members";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

export function ProjectFormDialog({ members, project }: { members: Member[]; project?: Project }) {
  const [open, setOpen] = useState(false);
  const action = project ? updateProject : createProject;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ variant: project ? "outline" : "default", size: "sm" })}
      >
        {project ? <Pencil /> : <Plus />}
        {project ? "Edit" : "New Project"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {project ? "Update the project details." : "Set up a new project to track."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {project && <input type="hidden" name="id" value={project.id} />}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={project?.name} placeholder="e.g. Website Redesign" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description}
              placeholder="Scope and objectives"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ownerId">Owner</Label>
              <Select name="ownerId" defaultValue={project?.ownerId ?? members[0]?.id}>
                <SelectTrigger id="ownerId" className="w-full">
                  <SelectValue placeholder="Choose owner" />
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
              <Label htmlFor="stage">Stage</Label>
              <Select name="stage" defaultValue={project?.stage ?? "Planning"}>
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={project?.startDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={project?.dueDate} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-auto">{project ? "Save changes" : "Create project"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
