import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type Tone = "gray" | "blue" | "amber" | "red" | "green" | "purple" | "teal";

const TONE_CLASSES: Record<Tone, string> = {
  gray: "bg-muted text-muted-foreground",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  red: "bg-red-500/15 text-red-700 dark:text-red-400",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  purple: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
};

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return <Badge className={cn(TONE_CLASSES[tone], className)}>{children}</Badge>;
}

export const TASK_STATUS_TONE: Record<string, Tone> = {
  backlog: "gray",
  inprogress: "blue",
  review: "amber",
  done: "green",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  inprogress: "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITY_TONE: Record<string, Tone> = {
  low: "green",
  medium: "amber",
  high: "red",
};

export const RISK_LEVEL_TONE: Record<string, Tone> = {
  low: "green",
  medium: "amber",
  high: "red",
};

export const PROJECT_STAGE_TONE: Record<string, Tone> = {
  Planning: "gray",
  "In Progress": "blue",
  Review: "amber",
  Complete: "green",
};
