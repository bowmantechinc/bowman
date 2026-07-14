import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ToneBadge, PROJECT_STAGE_TONE } from "@/components/tone-badge";
import { MemberAvatar } from "@/components/member-avatar";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { projectsRepo } from "@/lib/db/projects";
import { tasksRepo } from "@/lib/db/tasks";
import { membersRepo } from "@/lib/db/members";
import { isManager } from "@/lib/auth/dal";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const [projects, tasks, members, session] = await Promise.all([
    projectsRepo.list(),
    tasksRepo.list(),
    membersRepo.list(),
    getSession(),
  ]);

  const canManage = session ? isManager(session.role) : false;

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length === 1 ? "" : "s"}`}
        actions={canManage ? <ProjectFormDialog members={members} /> : undefined}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects yet"
          description="Create your first project to start organizing work."
          action={canManage ? <ProjectFormDialog members={members} /> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const pTasks = tasks.filter((t) => t.projectId === p.id);
            const done = pTasks.filter((t) => t.status === "done").length;
            const pct = pTasks.length ? Math.round((done / pTasks.length) * 100) : 0;
            const owner = members.find((m) => m.id === p.ownerId);
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-colors hover:border-foreground/20">
                  <CardContent className="flex h-full flex-col">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-medium">{p.name}</h3>
                      <ToneBadge tone={PROJECT_STAGE_TONE[p.stage] ?? "gray"}>{p.stage}</ToneBadge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 flex-1 text-sm">
                      {p.description || "No description"}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-muted-foreground text-xs">{pct}%</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {p.memberIds.slice(0, 4).map((mid) => {
                          const m = members.find((x) => x.id === mid);
                          if (!m) return null;
                          return (
                            <MemberAvatar
                              key={mid}
                              name={m.name}
                              initials={m.initials}
                              color={m.color}
                              textColor={m.textColor}
                              size={24}
                              className="ring-background ring-2"
                            />
                          );
                        })}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {owner ? `Owner: ${owner.name}` : ""}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
