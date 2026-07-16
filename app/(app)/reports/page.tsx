import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart2 } from "lucide-react";
import { ToneBadge, PROJECT_STAGE_TONE, TASK_STATUS_TONE, TASK_STATUS_LABEL } from "@/components/tone-badge";
import { MemberAvatar } from "@/components/member-avatar";
import { ProjectPicker } from "@/components/reports/project-picker";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { ExportPdfButton } from "@/components/reports/export-pdf-button";
import { projectsRepo } from "@/lib/db/projects";
import { tasksRepo } from "@/lib/db/tasks";
import { risksRepo } from "@/lib/db/risks";
import { membersRepo } from "@/lib/db/members";
import { computeProjectReport } from "@/lib/reports";
import { TASK_STATUSES } from "@/lib/constants";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;
  const [projects, tasks, risks, members] = await Promise.all([
    projectsRepo.list(),
    tasksRepo.list(),
    risksRepo.list(),
    membersRepo.list(),
  ]);

  if (projects.length === 0) {
    return (
      <div>
        <PageHeader title="Reports" description="Project status summaries." />
        <EmptyState
          icon={FileBarChart2}
          title="No projects yet"
          description="Create a project first to generate a status report."
        />
      </div>
    );
  }

  const selected = projects.find((p) => p.id === projectId) ?? projects[0];
  const report = computeProjectReport(selected, tasks, risks, members);
  const generatedAt = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const fileSlug = selected.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const fileName = `${fileSlug || "project"}-report-${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate a status summary for any project."
        actions={
          <>
            <ProjectPicker projects={projects} selectedId={selected.id} />
            <PrintReportButton />
            <ExportPdfButton targetId="report-content" fileName={fileName} />
          </>
        }
        className="print:hidden"
      />

      <div id="report-content" className="space-y-4">
        <div className="hidden print:block print:mb-4">
          <p className="text-muted-foreground text-xs">Generated {generatedAt}</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{report.project.name}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {report.project.description || "No description"}
              </p>
            </div>
            <ToneBadge tone={PROJECT_STAGE_TONE[report.project.stage] ?? "gray"}>
              {report.project.stage}
            </ToneBadge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground text-xs">Owner</div>
                <div className="text-sm font-medium">{report.owner?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Team size</div>
                <div className="text-sm font-medium">{report.team.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Due date</div>
                <div className="text-sm font-medium">{report.project.dueDate || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Schedule</div>
                <div className="text-sm font-medium">
                  {report.daysToDue === null
                    ? "—"
                    : report.daysToDue < 0
                      ? `${Math.abs(report.daysToDue)}d overdue`
                      : `${report.daysToDue}d left`}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Overall progress
                </span>
                <span className="text-sm font-medium">{report.progressPct}%</span>
              </div>
              <Progress value={report.progressPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Task breakdown ({report.totalTasks})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {report.totalTasks === 0 ? (
                <p className="text-muted-foreground text-sm">No tasks yet.</p>
              ) : (
                TASK_STATUSES.map((s) => {
                  const count = report.taskCounts[s];
                  const pct = report.totalTasks ? Math.round((count / report.totalTasks) * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <ToneBadge tone={TASK_STATUS_TONE[s]} className="w-24 shrink-0 justify-center">
                        {TASK_STATUS_LABEL[s]}
                      </ToneBadge>
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-muted-foreground w-14 shrink-0 text-right text-xs">
                        {count} · {pct}%
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Risk summary ({report.totalRisks})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {report.totalRisks === 0 ? (
                <p className="text-muted-foreground text-sm">No risks logged.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <ToneBadge tone="red">High</ToneBadge>
                    <span className="font-medium">{report.riskCounts.high}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <ToneBadge tone="amber">Medium</ToneBadge>
                    <span className="font-medium">{report.riskCounts.medium}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <ToneBadge tone="green">Low</ToneBadge>
                    <span className="font-medium">{report.riskCounts.low}</span>
                  </div>
                </>
              )}
              {report.overdueTasks.length > 0 && (
                <p className="text-destructive border-t pt-2 text-xs">
                  {report.overdueTasks.length} task{report.overdueTasks.length === 1 ? "" : "s"} overdue
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Team ({report.team.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {report.team.length === 0 ? (
              <p className="text-muted-foreground text-sm">No members assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {report.team.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <MemberAvatar name={m.name} initials={m.initials} color={m.color} textColor={m.textColor} size={26} />
                    <span className="text-sm">{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-4">
            <CardTitle className="text-sm">Tasks</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {report.tasks.length === 0 ? (
              <p className="text-muted-foreground px-4 pb-4 text-sm">No tasks yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.tasks.map((t) => {
                    const owner = members.find((m) => m.id === t.ownerId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell className="text-muted-foreground">{owner?.name ?? "Unassigned"}</TableCell>
                        <TableCell>
                          <ToneBadge tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</ToneBadge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{t.progress}%</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{t.dueDate || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
