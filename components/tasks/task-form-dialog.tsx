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
import { createTask, updateTask } from "@/lib/actions/tasks";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import type { Task } from "@/lib/db/tasks";
import { TASK_STATUS_LABEL } from "@/components/tone-badge";
import type { Project } from "@/lib/db/projects";
import type { Member } from "@/lib/db/members";
import type { Label as TaskLabel } from "@/lib/db/labels";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

export function TaskFormDialog({
  members,
  projects,
  labels,
  task,
  defaultProjectId,
  defaultStatus,
  trigger,
}: {
  members: Member[];
  projects: Project[];
  labels: TaskLabel[];
  task?: Task;
  defaultProjectId?: string;
  defaultStatus?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = task ? updateTask : createTask;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={trigger ? undefined : buttonVariants({ variant: task ? "outline" : "default", size: "sm" })}
      >
        {trigger ?? (
          <>
            {task ? <Pencil /> : <Plus />}
            {task ? "Edit" : "New Task"}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update this task." : "Add a task and assign it to someone."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {task && <input type="hidden" name="id" value={task.id} />}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={task?.title} placeholder="e.g. Draft homepage copy" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={task?.description} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project</Label>
              <Select name="projectId" defaultValue={task?.projectId ?? defaultProjectId ?? projects[0]?.id}>
                <SelectTrigger id="projectId" className="w-full">
                  <SelectValue placeholder="Choose project">
                    {(id: string) => projects.find((p) => p.id === id)?.name}
                  </SelectValue>
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
              <Label htmlFor="ownerId">Assignee</Label>
              <Select name="ownerId" defaultValue={task?.ownerId || members[0]?.id}>
                <SelectTrigger id="ownerId" className="w-full">
                  <SelectValue placeholder="Assign to">
                    {(id: string) => members.find((m) => m.id === id)?.name}
                  </SelectValue>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="labelId">Label</Label>
              <Select name="labelId" defaultValue={task?.labelId ?? labels[0]?.id ?? ""}>
                <SelectTrigger id="labelId" className="w-full">
                  <SelectValue placeholder="Choose label">
                    {(id: string) => labels.find((l) => l.id === id)?.name}
                  </SelectValue>
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
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={task?.priority ?? "medium"}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={task?.startDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.dueDate} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Stage</Label>
              <Select name="status" defaultValue={task?.status ?? defaultStatus ?? "backlog"}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue>{(status: string) => TASK_STATUS_LABEL[status] ?? status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input id="progress" name="progress" type="number" min={0} max={100} defaultValue={task?.progress ?? 0} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-auto">{task ? "Save changes" : "Create task"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
