import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Plus, UserPlus, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge, PROJECT_STAGE_TONE } from "@/components/tone-badge";
import { getDashboardData } from "@/lib/dashboard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RelatedArticlesCard } from "@/components/knowledge/related-articles-card";

export const metadata: Metadata = { title: "Dashboard" };

const ACTIVITY_ICONS: Record<string, typeof CheckCircle2> = {
  Plus: Plus,
  UserPlus: UserPlus,
  UserCheck: UserCheck,
  MessageCircle: MessageCircle,
  CheckCircle2: CheckCircle2,
};

function timeAgo(iso: string) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <PageHeader title="Dashboard" description="A live overview of everything in flight." />

      <RelatedArticlesCard view="/dashboard" />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall Progress" value={`${data.overallPct}%`}>
          <Progress value={data.overallPct} className="mt-2 h-1.5" />
        </StatCard>
        <StatCard
          label="Active Projects"
          value={data.projectCount}
          sub={
            data.atRiskProjectCount > 0 ? (
              <ToneBadge tone="amber">{data.atRiskProjectCount} at risk</ToneBadge>
            ) : (
              <ToneBadge tone="gray">On track</ToneBadge>
            )
          }
        />
        <StatCard
          label="Open Risks"
          value={data.riskTotal}
          sub={
            data.riskTotal ? (
              <div className="flex gap-1.5">
                {data.riskCritical > 0 && <ToneBadge tone="red">{data.riskCritical} critical</ToneBadge>}
                {data.riskMedium > 0 && <ToneBadge tone="amber">{data.riskMedium} medium</ToneBadge>}
              </div>
            ) : (
              <ToneBadge tone="gray">None logged</ToneBadge>
            )
          }
        />
        <StatCard
          label="Next Deadline"
          value={data.nextDeadline ? (data.nextDeadline.daysLeft < 0 ? "Overdue" : `${data.nextDeadline.daysLeft}d`) : "—"}
          sub={
            data.nextDeadline ? (
              <span className="truncate">{data.nextDeadline.title}</span>
            ) : (
              "No upcoming due dates"
            )
          }
        />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Project Progress
        </h2>
        <Link href="/projects" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          View all
        </Link>
      </div>

      {data.projectRows.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking progress."
          className="mb-6"
        />
      ) : (
        <Card className="mb-6 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="min-w-[180px]">Progress</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.projectRows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/projects/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.ownerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={p.pct} className="h-1.5 flex-1" />
                      <span className="text-muted-foreground w-9 text-right text-xs">{p.pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ToneBadge tone={PROJECT_STAGE_TONE[p.stage] ?? "gray"}>{p.stage}</ToneBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.dueDate || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <h2 className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-wide uppercase">
        Recent Activity
      </h2>
      <Card>
        <CardContent className="px-4">
          {data.recentActivity.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No activity yet — actions you take will show up here.
            </p>
          ) : (
            <ul>
              {data.recentActivity.map((a, i) => {
                const Icon = ACTIVITY_ICONS[a.icon] ?? CheckCircle2;
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 py-2.5",
                      i !== data.recentActivity.length - 1 && "border-b"
                    )}
                  >
                    <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="flex-1 text-sm">{a.text}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(a.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
