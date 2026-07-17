import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { KanbanSquare } from "lucide-react";
import { tasksRepo } from "@/lib/db/tasks";
import { taskCommentsRepo } from "@/lib/db/taskComments";
import { projectsRepo } from "@/lib/db/projects";
import { membersRepo } from "@/lib/db/members";
import { labelsRepo } from "@/lib/db/labels";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { RelatedArticlesCard } from "@/components/knowledge/related-articles-card";

export const metadata: Metadata = { title: "Task Board" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; label?: string }>;
}) {
  const { project: projectFilter, label: labelFilter } = await searchParams;
  const [tasks, comments, projects, members, labels] = await Promise.all([
    tasksRepo.list(),
    taskCommentsRepo.list(),
    projectsRepo.list(),
    membersRepo.list(),
    labelsRepo.list(),
  ]);

  const filtered = tasks.filter(
    (t) => (!projectFilter || t.projectId === projectFilter) && (!labelFilter || t.labelId === labelFilter)
  );

  const activeProject = projects.find((p) => p.id === projectFilter);

  return (
    <div>
      <PageHeader
        title="Task Board"
        description={activeProject ? `Filtered to ${activeProject.name}` : "All projects"}
        actions={
          projects.length > 0 && (
            <TaskFormDialog members={members} projects={projects} labels={labels} defaultProjectId={projectFilter} />
          )
        }
      />

      <RelatedArticlesCard view="/tasks" />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Link
          href="/tasks"
          className={cn(buttonVariants({ variant: !labelFilter ? "secondary" : "ghost", size: "sm" }))}
        >
          All
        </Link>
        {labels.map((l) => (
          <Link
            key={l.id}
            href={`/tasks?label=${l.id}${projectFilter ? `&project=${projectFilter}` : ""}`}
            className={cn(buttonVariants({ variant: labelFilter === l.id ? "secondary" : "ghost", size: "sm" }))}
          >
            {l.name}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Create a project first"
          description="Tasks belong to a project. Create one from the Projects page."
        />
      ) : (
        <KanbanBoard tasks={filtered} members={members} labels={labels} projects={projects} comments={comments} />
      )}
    </div>
  );
}
