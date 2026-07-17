import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { ToneBadge } from "@/components/tone-badge";
import { VendorFormDialog } from "@/components/vendors/vendor-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteVendor } from "@/lib/actions/vendors";
import { vendorsRepo } from "@/lib/db/vendors";
import { RelatedArticlesCard } from "@/components/knowledge/related-articles-card";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const vendors = await vendorsRepo.list();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <PageHeader
        title="Vendors"
        description={`${vendors.length} vendor${vendors.length === 1 ? "" : "s"}`}
        actions={<VendorFormDialog />}
      />

      <RelatedArticlesCard view="/vendors" />

      {vendors.length === 0 ? (
        <EmptyState icon={Receipt} title="No vendors yet" description="Track vendor licenses and renewals here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => {
            const end = v.licenseEnd ? new Date(v.licenseEnd) : null;
            const daysLeft = end ? Math.ceil((end.getTime() - today.getTime()) / 86_400_000) : null;
            const tone = daysLeft === null ? "gray" : daysLeft < 0 ? "red" : daysLeft < 30 ? "amber" : "green";
            return (
              <Card key={v.id}>
                <CardContent>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium">{v.name}</h3>
                    <ToneBadge tone="gray">{v.supportLevel}</ToneBadge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {v.contact}
                    {v.contact && v.email && " · "}
                    {v.email}
                  </p>
                  {v.notes && <p className="text-muted-foreground mt-2 text-sm">{v.notes}</p>}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">License expires</span>
                    {v.licenseEnd ? (
                      <ToneBadge tone={tone}>
                        {v.licenseEnd} ({daysLeft !== null && daysLeft < 0 ? "expired" : `${daysLeft}d left`})
                      </ToneBadge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <VendorFormDialog vendor={v} />
                    <ConfirmDeleteButton action={deleteVendor.bind(null, v.id)} confirmMessage="Delete this vendor?" />
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
