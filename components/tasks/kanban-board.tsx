"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarDays, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge, TASK_STATUS_LABEL } from "@/components/tone-badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteTask } from "@/lib/actions/tasks";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import type { Task } from "@/lib/db/tasks";
import type { TaskComment } from "@/lib/db/taskComments";
import type { Member } from "@/lib/db/members";
import type { Project } from "@/lib/db/projects";
import type { Label } from "@/lib/db/labels";
import { cn } from "@/lib/utils";

const PRIORITY_DOT_CLASS: Record<string, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

function TaskCard({
  task,
  members,
  labels,
  projects,
  commentCount,
  onOpen,
}: {
  task: Task;
  members: Member[];
  labels: Label[];
  projects: Project[];
  commentCount: number;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const owner = members.find((m) => m.id === task.ownerId);
  const label = labels.find((l) => l.id === task.labelId);
  const project = projects.find((p) => p.id === task.projectId);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
          : undefined
      }
      className={cn(
        "bg-card mb-2 cursor-pointer rounded-lg border p-2.5 text-sm shadow-sm transition-colors hover:border-foreground/20",
        isDragging && "opacity-50"
      )}
    >
      <div className="mb-2 flex items-start gap-1.5">
        <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", PRIORITY_DOT_CLASS[task.priority])} />
        <span className="line-clamp-2 leading-snug">{task.title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {label && <ToneBadge tone="blue">{label.name}</ToneBadge>}
        {project && (
          <ToneBadge tone="gray" className="max-w-full truncate">
            {project.name}
          </ToneBadge>
        )}
        {task.dueDate && (
          <span className="text-muted-foreground flex items-center gap-0.5 text-[11px]">
            <CalendarDays className="size-3" />
            {task.dueDate}
          </span>
        )}
        {commentCount > 0 && (
          <span className="text-muted-foreground flex items-center gap-0.5 text-[11px]">
            <MessageCircle className="size-3" />
            {commentCount}
          </span>
        )}
        {owner && (
          <MemberAvatar
            name={owner.name}
            initials={owner.initials}
            color={owner.color}
            textColor={owner.textColor}
            size={20}
            className="ml-auto"
          />
        )}
      </div>
    </div>
  );
}

function Column({
  status,
  tasks,
  members,
  labels,
  projects,
  comments,
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  members: Member[];
  labels: Label[];
  projects: Project[];
  comments: TaskComment[];
  onOpenTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-muted/30 flex min-h-[200px] flex-col rounded-lg border transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="text-muted-foreground flex items-center justify-between border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase">
        {TASK_STATUS_LABEL[status]}
        <span className="bg-muted rounded-full px-1.5 py-0.5 text-[11px] font-medium normal-case">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            members={members}
            labels={labels}
            projects={projects}
            commentCount={comments.filter((c) => c.taskId === t.id).length}
            onOpen={() => onOpenTask(t.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  members,
  labels,
  projects,
  comments,
  canManage,
}: {
  tasks: Task[];
  members: Member[];
  labels: Label[];
  projects: Project[];
  comments: TaskComment[];
  canManage: boolean;
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  // Resync from the server-provided prop whenever it changes (e.g. after a
  // create/edit/delete elsewhere triggers a re-render), without a useEffect —
  // this is React's documented pattern for deriving state from a changed prop.
  const [prevTasks, setPrevTasks] = useState(tasks);
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setLocalTasks(tasks);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const current = localTasks.find((t) => t.id === taskId);
    if (!current || current.status === newStatus) return;

    setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    updateTaskStatus(taskId, newStatus).catch(() => {
      setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: current.status } : t)));
      toast.error("Couldn't move task — try again.");
    });
  }

  const detailTask = localTasks.find((t) => t.id === detailTaskId) ?? null;

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={localTasks.filter((t) => t.status === status)}
              members={members}
              labels={labels}
              projects={projects}
              comments={comments}
              onOpenTask={setDetailTaskId}
            />
          ))}
        </div>
      </DndContext>
      <TaskDetailDialog
        task={detailTask}
        open={!!detailTaskId}
        onOpenChange={(o) => !o && setDetailTaskId(null)}
        members={members}
        projects={projects}
        labels={labels}
        comments={comments}
        canManage={canManage}
      />
    </>
  );
}
