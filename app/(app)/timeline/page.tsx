import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { GanttChartSquare } from "lucide-react";
import { ToneBadge, TASK_STATUS_TONE, TASK_STATUS_LABEL } from "@/components/tone-badge";
import { computeTimelineRows } from "@/lib/timeline";
import { tasksRepo } from "@/lib/db/tasks";
import { projectsRepo } from "@/lib/db/projects";
import { membersRepo } from "@/lib/db/members";

export const metadata: Metadata = { title: "Timeline" };

const BAR_COLOR_CLASS: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-violet-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  coral: "bg-orange-500",
  green: "bg-emerald-500",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectFilter } = await searchParams;
  const [tasks, projects, members] = await Promise.all([
    tasksRepo.list(),
    projectsRepo.list(),
    membersRepo.list(),
  ]);

  const scopedTasks = projectFilter ? tasks.filter((t) => t.projectId === projectFilter) : tasks;
  const { rows, ticks, todayPos } = computeTimelineRows(scopedTasks, projects, members);

  return (
    <div>
      <PageHeader title="Timeline" description="Project schedules derived from task due dates." />
      {rows.length === 0 ? (
        <EmptyState
          icon={GanttChartSquare}
          title="Nothing to show yet"
          description="Add due dates to tasks to populate the timeline."
        />
      ) : (
        <Card className="overflow-x-auto py-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground w-56 px-4 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
                  Project / Task
                </th>
                <th className="text-muted-foreground w-32 px-3 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
                  Owner
                </th>
                <th className="text-muted-foreground w-28 px-3 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
                  Status
                </th>
                <th className="text-muted-foreground px-3 py-2.5 text-left text-xs font-semibold tracking-wide uppercase">
                  Schedule
                </th>
              </tr>
              <tr className="border-b">
                <th colSpan={3} className="border-r" />
                <th className="px-3 pt-1 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-3 flex-1">
                      {ticks.map((t, i) => (
                        <span
                          key={t.pos}
                          className="text-muted-foreground/70 absolute text-[10px] font-normal normal-case whitespace-nowrap"
                          style={
                            i === 0
                              ? { left: 0 }
                              : i === ticks.length - 1
                                ? { right: 0 }
                                : { left: `${t.pos}%`, transform: "translateX(-50%)" }
                          }
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                    <span className="w-28 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b last:border-0">
                  <td
                    className={
                      r.sub
                        ? "text-muted-foreground truncate px-4 py-2 pl-8 text-xs"
                        : "truncate px-4 py-2 font-medium"
                    }
                  >
                    {r.label}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">{r.ownerName}</td>
                  <td className="px-3 py-2">
                    <ToneBadge tone={TASK_STATUS_TONE[r.status] ?? "gray"}>
                      {TASK_STATUS_LABEL[r.status] ?? r.status}
                    </ToneBadge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted relative h-4 min-w-[240px] flex-1 overflow-hidden rounded">
                        {ticks.slice(1, -1).map((t) => (
                          <div
                            key={t.pos}
                            className="bg-border/60 absolute top-0 h-full w-px"
                            style={{ left: `${t.pos}%` }}
                          />
                        ))}
                        {todayPos !== null && (
                          <div
                            className="absolute top-0 h-full w-px bg-red-500/70"
                            style={{ left: `${todayPos}%` }}
                          />
                        )}
                        <div
                          className={`absolute top-0 h-4 rounded opacity-80 ${BAR_COLOR_CLASS[r.color] ?? "bg-blue-500"}`}
                          style={{ left: `${r.start}%`, width: `${r.end - r.start}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-28 shrink-0 text-xs whitespace-nowrap">
                        {r.dateLabel}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
