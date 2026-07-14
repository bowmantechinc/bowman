import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert } from "lucide-react";
import { ToneBadge, RISK_LEVEL_TONE } from "@/components/tone-badge";
import { RiskFormDialog } from "@/components/risks/risk-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteRisk } from "@/lib/actions/risks";
import { risksRepo } from "@/lib/db/risks";
import { projectsRepo } from "@/lib/db/projects";
import { membersRepo } from "@/lib/db/members";

export const metadata: Metadata = { title: "Risk Register" };

export default async function RisksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectFilter } = await searchParams;
  const [risks, projects, members] = await Promise.all([
    risksRepo.list(),
    projectsRepo.list(),
    membersRepo.list(),
  ]);

  const filtered = projectFilter ? risks.filter((r) => r.projectId === projectFilter) : risks;
  const critical = filtered.filter((r) => r.level === "high").length;

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description={`${filtered.length} risk${filtered.length === 1 ? "" : "s"} · ${critical} critical`}
        actions={projects.length > 0 && <RiskFormDialog members={members} projects={projects} defaultProjectId={projectFilter} />}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No risks logged" description="Track risks as they come up." />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Risk</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="min-w-[180px]">Mitigation</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const owner = members.find((m) => m.id === r.ownerId);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-xs">{r.description}</TableCell>
                    <TableCell className="text-muted-foreground">{r.category}</TableCell>
                    <TableCell className="text-muted-foreground">{r.likelihood}</TableCell>
                    <TableCell className="text-muted-foreground">{r.impact}</TableCell>
                    <TableCell>
                      <ToneBadge tone={RISK_LEVEL_TONE[r.level]}>{r.level}</ToneBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{owner?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs">{r.mitigation || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <RiskFormDialog members={members} projects={projects} risk={r} />
                        <ConfirmDeleteButton action={deleteRisk.bind(null, r.id)} confirmMessage="Delete this risk?" />
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
