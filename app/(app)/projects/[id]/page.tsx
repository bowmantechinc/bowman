import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserMinus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToneBadge, PROJECT_STAGE_TONE, TASK_STATUS_TONE, TASK_STATUS_LABEL, RISK_LEVEL_TONE } from "@/components/tone-badge";
import { MemberAvatar } from "@/components/member-avatar";
import { EmptyState } from "@/components/empty-state";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { AttachmentsCard } from "@/components/projects/attachments-card";
import { projectsRepo } from "@/lib/db/projects";
import { tasksRepo } from "@/lib/db/tasks";
import { risksRepo } from "@/lib/db/risks";
import { membersRepo } from "@/lib/db/members";
import { attachmentsRepo } from "@/lib/db/attachments";
import { isManager } from "@/lib/auth/dal";
import { getSession } from "@/lib/auth/session";
import { removeProjectMember, addProjectMemberFromForm } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await projectsRepo.get(id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, tasks, risks, members, attachments, session] = await Promise.all([
    projectsRepo.get(id),
    tasksRepo.list(),
    risksRepo.list(),
    membersRepo.list(),
    attachmentsRepo.list(),
    getSession(),
  ]);

  if (!project) notFound();

  const canManage = session ? isManager(session.role) : false;
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectRisks = risks.filter((r) => r.projectId === project.id);
  const projectMembers = project.memberIds.map((mid) => members.find((m) => m.id === mid)).filter((m) => !!m);
  const availableMembers = members.filter((m) => !project.memberIds.includes(m.id));
  const projectAttachments = attachments.filter((a) => a.projectId === project.id);
  const owner = members.find((m) => m.id === project.ownerId);

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description || "No description"}
        actions={
          <>
            <ToneBadge tone={PROJECT_STAGE_TONE[project.stage] ?? "gray"}>{project.stage}</ToneBadge>
            {canManage && <ProjectFormDialog members={members} project={project} />}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Tasks</CardTitle>
              <Link
                href={`/tasks?project=${project.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open task board
              </Link>
            </CardHeader>
            <CardContent>
              {projectTasks.length === 0 ? (
                <EmptyState title="No tasks yet" description="Create tasks from the Task Board." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectTasks.map((t) => {
                      const m = members.find((x) => x.id === t.ownerId);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.title}</TableCell>
                          <TableCell className="text-muted-foreground">{m?.name ?? "Unassigned"}</TableCell>
                          <TableCell>
                            <ToneBadge tone={TASK_STATUS_TONE[t.status]}>{TASK_STATUS_LABEL[t.status]}</ToneBadge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{t.dueDate || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Risks</CardTitle>
              <Link
                href={`/risks?project=${project.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Open risk register
              </Link>
            </CardHeader>
            <CardContent>
              {projectRisks.length === 0 ? (
                <EmptyState title="No risks logged" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectRisks.map((r) => {
                      const m = members.find((x) => x.id === r.ownerId);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                          <TableCell>
                            <ToneBadge tone={RISK_LEVEL_TONE[r.level]}>{r.level}</ToneBadge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{m?.name ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span>{owner?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start date</span>
                <span>{project.startDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span>{project.dueDate || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectMembers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No members assigned.</p>
              ) : (
                <ul className="space-y-2">
                  {projectMembers.map((m) => (
                    <li key={m!.id} className="flex items-center gap-2.5">
                      <MemberAvatar name={m!.name} initials={m!.initials} color={m!.color} textColor={m!.textColor} size={26} />
                      <span className="flex-1 truncate text-sm">{m!.name}</span>
                      {canManage && (
                        <form action={removeProjectMember.bind(null, project.id, m!.id)}>
                          <Button type="submit" variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                            <UserMinus className="size-3.5" />
                          </Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && availableMembers.length > 0 && (
                <form action={addProjectMemberFromForm} className="flex items-center gap-2 border-t pt-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <Select name="memberId" defaultValue={availableMembers[0]?.id}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" size="sm" variant="outline">
                    Add
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <AttachmentsCard projectId={project.id} attachments={projectAttachments} />
        </div>
      </div>
    </div>
  );
}
