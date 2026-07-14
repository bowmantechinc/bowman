import "server-only";
import { projectsRepo } from "@/lib/db/projects";
import { tasksRepo } from "@/lib/db/tasks";
import { risksRepo } from "@/lib/db/risks";
import { membersRepo } from "@/lib/db/members";
import { activityRepo } from "@/lib/db/activity";

export interface ProjectProgressRow {
  id: string;
  name: string;
  color: string;
  ownerName: string;
  pct: number;
  totalTasks: number;
  stage: string;
  dueDate: string;
  overdue: boolean;
}

export interface DashboardData {
  totalTasks: number;
  doneTasks: number;
  overallPct: number;
  projectCount: number;
  atRiskProjectCount: number;
  riskTotal: number;
  riskCritical: number;
  riskMedium: number;
  nextDeadline: { title: string; dueDate: string; daysLeft: number } | null;
  projectRows: ProjectProgressRow[];
  recentActivity: { id: string; icon: string; text: string; actorName: string; createdAt: string }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [projects, tasks, risks, members, activity] = await Promise.all([
    projectsRepo.list(),
    tasksRepo.list(),
    risksRepo.list(),
    membersRepo.list(),
    activityRepo.list(),
  ]);

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unassigned";

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projectRows: ProjectProgressRow[] = projects
    .map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const done = pTasks.filter((t) => t.status === "done").length;
      const pct = pTasks.length ? Math.round((done / pTasks.length) * 100) : 0;
      const overdue = pTasks.some(
        (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate + "T00:00:00") < today
      );
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        ownerName: memberName(p.ownerId),
        pct,
        totalTasks: pTasks.length,
        stage: p.stage,
        dueDate: p.dueDate,
        overdue,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const atRiskProjectCount = projectRows.filter((p) => p.overdue).length;

  const riskCritical = risks.filter((r) => r.level === "high").length;
  const riskMedium = risks.filter((r) => r.level === "medium").length;

  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.dueDate)
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextDeadline = upcoming.length
    ? {
        title: upcoming[0].title,
        dueDate: upcoming[0].dueDate,
        daysLeft: Math.round(
          (new Date(upcoming[0].dueDate + "T00:00:00").getTime() - today.getTime()) / 86_400_000
        ),
      }
    : null;

  const recentActivity = activity
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((a) => ({ ...a, actorName: memberName(a.actorId) }));

  return {
    totalTasks,
    doneTasks,
    overallPct,
    projectCount: projects.length,
    atRiskProjectCount,
    riskTotal: risks.length,
    riskCritical,
    riskMedium,
    nextDeadline,
    projectRows,
    recentActivity,
  };
}
