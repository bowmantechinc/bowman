import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { attachmentsRepo } from "@/lib/db/attachments";
import { projectsRepo } from "@/lib/db/projects";
import { formatBytes } from "@/lib/utils";
import { requireSession, isProjectMember } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const session = await requireSession();
  const [attachments, allProjects] = await Promise.all([attachmentsRepo.list(), projectsRepo.list()]);
  const projects = allProjects.filter((p) => isProjectMember(p, session));
  const visibleProjectIds = new Set(projects.map((p) => p.id));
  const sorted = attachments
    .filter((a) => visibleProjectIds.has(a.projectId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Documents"
        description={`${sorted.length} file${sorted.length === 1 ? "" : "s"} across your projects`}
      />

      {sorted.length === 0 ? (
        <EmptyState icon={Paperclip} title="No documents yet" description="Files uploaded to any project will show up here." />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((a) => {
                const project = projects.find((p) => p.id === a.projectId);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <a
                        href={a.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:underline"
                      >
                        <FileText className="text-muted-foreground size-4 shrink-0" />
                        <span className="truncate">{a.name}</span>
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project ? (
                        <Link href={`/projects/${project.id}`} className="hover:underline">
                          {project.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.uploadedBy}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatBytes(a.size)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DeleteDocumentButton id={a.id} projectId={a.projectId} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
