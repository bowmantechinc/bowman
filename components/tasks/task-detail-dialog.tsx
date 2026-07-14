"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { ToneBadge, TASK_STATUS_TONE, TASK_STATUS_LABEL, PRIORITY_TONE } from "@/components/tone-badge";
import { MemberAvatar } from "@/components/member-avatar";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { addTaskComment } from "@/lib/actions/tasks";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import type { Task } from "@/lib/db/tasks";
import type { TaskComment } from "@/lib/db/taskComments";
import type { Member } from "@/lib/db/members";
import type { Project } from "@/lib/db/projects";
import type { Label } from "@/lib/db/labels";

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  members,
  projects,
  labels,
  comments,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  projects: Project[];
  labels: Label[];
  comments: TaskComment[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(addTaskComment, INITIAL_ACTION_STATE);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (!task) return null;

  const owner = members.find((m) => m.id === task.ownerId);
  const project = projects.find((p) => p.id === task.projectId);
  const label = labels.find((l) => l.id === task.labelId);
  const taskComments = comments
    .filter((c) => c.taskId === task.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-start justify-between gap-3">
          <DialogTitle className="pr-8">{task.title}</DialogTitle>
          <TaskFormDialog
            task={task}
            members={members}
            projects={projects}
            labels={labels}
            trigger={<span className="text-xs">Edit</span>}
          />
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {label && <ToneBadge tone="blue">{label.name}</ToneBadge>}
          {project && <ToneBadge tone="gray">{project.name}</ToneBadge>}
          <ToneBadge tone={TASK_STATUS_TONE[task.status]}>{TASK_STATUS_LABEL[task.status]}</ToneBadge>
          <ToneBadge tone={PRIORITY_TONE[task.priority]}>{task.priority} priority</ToneBadge>
          {task.dueDate && <ToneBadge tone="gray">Due {task.dueDate}</ToneBadge>}
        </div>

        {task.description && <p className="text-muted-foreground text-sm">{task.description}</p>}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Assigned to</span>
          {owner ? (
            <span className="flex items-center gap-1.5">
              <MemberAvatar name={owner.name} initials={owner.initials} color={owner.color} textColor={owner.textColor} size={20} />
              {owner.name}
            </span>
          ) : (
            "Unassigned"
          )}
        </div>

        <div className="border-t pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Comments</span>
            <span className="text-muted-foreground text-xs">{taskComments.length}</span>
          </div>
          <div className="bg-muted/40 mb-3 max-h-52 space-y-3 overflow-y-auto rounded-md border p-3">
            {taskComments.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-xs">No comments yet.</p>
            ) : (
              taskComments.map((c) => {
                const author = members.find((m) => m.id === c.authorId);
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{author?.name ?? "Unknown"}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm whitespace-pre-wrap">{c.text}</p>
                  </div>
                );
              })
            )}
          </div>
          {state?.error && (
            <div className="bg-destructive/10 text-destructive mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <form ref={formRef} action={formAction} className="flex items-start gap-2">
            <input type="hidden" name="taskId" value={task.id} />
            <Textarea name="text" placeholder="Add a comment for the team…" className="min-h-14 flex-1" required />
            <SubmitButton className="w-auto">
              <Send className="size-3.5" />
            </SubmitButton>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
