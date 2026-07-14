import "server-only";
import type { Task } from "@/lib/db/tasks";
import type { Project } from "@/lib/db/projects";
import type { Member } from "@/lib/db/members";

export interface TimelineRow {
  key: string;
  label: string;
  ownerName: string;
  status: string;
  start: number; // percent 0-100
  end: number; // percent 0-100
  color: string;
  sub: boolean;
}

export function computeTimelineRows(
  tasks: Task[],
  projects: Project[],
  members: Member[]
): TimelineRow[] {
  const scoped = tasks.filter((t) => t.dueDate);
  if (!scoped.length) return [];

  const allMs = scoped.map((t) => new Date(t.dueDate + "T00:00:00").getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let minMs = Math.min(today.getTime(), ...allMs);
  let maxMs = Math.max(...allMs);
  const rangeDays = Math.max(1, Math.round((maxMs - minMs) / 86_400_000));
  const padDays = Math.max(3, Math.round(rangeDays * 0.12));
  minMs -= padDays * 86_400_000;
  maxMs += padDays * 86_400_000;
  const totalDays = Math.max(1, (maxMs - minMs) / 86_400_000);
  const pos = (ms: number) => Math.max(0, Math.min(100, (ms - minMs) / 86_400_000 / totalDays * 100));

  const byProject = new Map<string, Task[]>();
  for (const t of scoped) {
    const list = byProject.get(t.projectId) ?? [];
    list.push(t);
    byProject.set(t.projectId, list);
  }

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unassigned";

  const rows: TimelineRow[] = [];
  for (const [projectId, list] of byProject) {
    const project = projects.find((p) => p.id === projectId);
    const sorted = list.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const ms = sorted.map((t) => new Date(t.dueDate + "T00:00:00").getTime());
    const start = pos(Math.min(...ms));
    const end = Math.max(start + 4, pos(Math.max(...ms)));
    const allDone = sorted.every((t) => t.status === "done");
    const anyActive = sorted.some((t) => t.status === "inprogress" || t.status === "review");
    const groupStatus = allDone ? "done" : anyActive ? "inprogress" : "backlog";
    const ownerCounts = new Map<string, number>();
    sorted.forEach((t) => ownerCounts.set(t.ownerId, (ownerCounts.get(t.ownerId) ?? 0) + 1));
    const topOwner = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    rows.push({
      key: projectId,
      label: project?.name ?? "Unassigned project",
      ownerName: memberName(topOwner),
      status: groupStatus,
      start,
      end,
      color: project?.color ?? "blue",
      sub: false,
    });

    sorted.forEach((t) => {
      const p = pos(new Date(t.dueDate + "T00:00:00").getTime());
      rows.push({
        key: t.id,
        label: `· ${t.title}`,
        ownerName: memberName(t.ownerId),
        status: t.status,
        start: Math.max(0, p - 1.5),
        end: Math.min(100, p + 1.5),
        color: project?.color ?? "blue",
        sub: true,
      });
    });
  }

  return rows;
}
