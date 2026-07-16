import "server-only";
import type { Task, TaskStatus } from "@/lib/db/tasks";
import { averageProgress } from "@/lib/db/tasks";
import type { Risk } from "@/lib/db/risks";
import type { Project } from "@/lib/db/projects";
import type { Member } from "@/lib/db/members";
import { TASK_STATUSES } from "@/lib/constants";

export interface ProjectReport {
  project: Project;
  owner: Member | null;
  team: Member[];
  progressPct: number;
  taskCounts: Record<TaskStatus, number>;
  totalTasks: number;
  overdueTasks: Task[];
  upcomingTasks: Task[];
  riskCounts: { high: number; medium: number; low: number };
  totalRisks: number;
  tasks: Task[];
  risks: Risk[];
  daysToDue: number | null;
}

export function computeProjectReport(
  project: Project,
  allTasks: Task[],
  allRisks: Risk[],
  members: Member[]
): ProjectReport {
  const tasks = allTasks.filter((t) => t.projectId === project.id);
  const risks = allRisks.filter((r) => r.projectId === project.id);
  const owner = members.find((m) => m.id === project.ownerId) ?? null;
  const team = project.memberIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is Member => !!m);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskCounts = Object.fromEntries(
    TASK_STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])
  ) as Record<TaskStatus, number>;

  const overdueTasks = tasks
    .filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate + "T00:00:00") < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcomingTasks = tasks
    .filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate + "T00:00:00") >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const riskCounts = {
    high: risks.filter((r) => r.level === "high").length,
    medium: risks.filter((r) => r.level === "medium").length,
    low: risks.filter((r) => r.level === "low").length,
  };

  const daysToDue = project.dueDate
    ? Math.round((new Date(project.dueDate + "T00:00:00").getTime() - today.getTime()) / 86_400_000)
    : null;

  return {
    project,
    owner,
    team,
    progressPct: averageProgress(tasks),
    taskCounts,
    totalTasks: tasks.length,
    overdueTasks,
    upcomingTasks,
    riskCounts,
    totalRisks: risks.length,
    tasks: tasks.slice().sort((a, b) => a.title.localeCompare(b.title)),
    risks,
    daysToDue,
  };
}
