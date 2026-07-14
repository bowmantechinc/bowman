import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/tone-badge";
import { AddItemForm } from "@/components/settings/add-item-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { addRole, removeRole, addLabel, removeLabel } from "@/lib/actions/settings";
import { rolesRepo } from "@/lib/db/roles";
import { labelsRepo } from "@/lib/db/labels";
import { membersRepo } from "@/lib/db/members";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();

  const [roles, labels, members] = await Promise.all([rolesRepo.list(), labelsRepo.list(), membersRepo.list()]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage roles and labels available across the workspace."
        actions={<ToneBadge tone="purple">Admin only</ToneBadge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddItemForm action={addRole} fieldName="label" placeholder="New role name" buttonLabel="Add Role" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {members.filter((m) => m.role === r.id).length}
                    </TableCell>
                    <TableCell>
                      <ConfirmDeleteButton action={removeRole.bind(null, r.id)} confirmMessage={`Remove the "${r.label}" role?`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddItemForm action={addLabel} fieldName="name" placeholder="New label name" buttonLabel="Add Label" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {labels.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {members.filter((m) => m.labelId === l.id).length}
                    </TableCell>
                    <TableCell>
                      <ConfirmDeleteButton action={removeLabel.bind(null, l.id)} confirmMessage={`Remove the "${l.name}" label?`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
