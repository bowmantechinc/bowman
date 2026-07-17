import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Boxes } from "lucide-react";
import { ResourceFormDialog } from "@/components/resources/resource-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { RESOURCE_ICONS } from "@/components/resources/resource-icons";
import { deleteResource } from "@/lib/actions/resources";
import { resourcesRepo } from "@/lib/db/resources";
import { RelatedArticlesCard } from "@/components/knowledge/related-articles-card";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const resources = await resourcesRepo.list();

  return (
    <div>
      <PageHeader
        title="Resources"
        description={`${resources.length} resource${resources.length === 1 ? "" : "s"}`}
        actions={<ResourceFormDialog />}
      />

      <RelatedArticlesCard view="/resources" />

      {resources.length === 0 ? (
        <EmptyState icon={Boxes} title="No resources yet" description="Track tools, systems, or deliverables here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const Icon = RESOURCE_ICONS[r.icon] ?? Boxes;
            return (
              <Card key={r.id}>
                <CardContent>
                  <div className="bg-muted mb-3 flex size-9 items-center justify-center rounded-md">
                    <Icon className="text-foreground size-4.5" />
                  </div>
                  <h3 className="font-medium">{r.name}</h3>
                  {r.detail && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{r.detail}</p>}
                  <Progress value={r.progress} className="mt-3 h-1.5" />
                  <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
                    <span>{r.label}</span>
                    <span>{r.progress}%</span>
                  </div>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <ResourceFormDialog resource={r} />
                    <ConfirmDeleteButton action={deleteResource.bind(null, r.id)} confirmMessage="Delete this resource?" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
