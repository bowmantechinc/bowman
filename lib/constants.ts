// Pure, dependency-free constants shared between server and client code.
// Keep this file free of "server-only" imports (like the Google Sheets
// client) so client components can import these enum values directly
// without accidentally pulling server-only modules into the browser bundle.

export const TASK_STATUSES = ["backlog", "inprogress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PROJECT_STAGES = ["Planning", "In Progress", "Review", "Complete"] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_EXTENSIONS = [".xlsx", ".xls", ".doc", ".docx", ".pptx", ".pdf", ".jpg", ".jpeg"];

// Sentinel for "no linked page" in the article form's Select (which can't use
// an empty-string value). Normalized back to "" before it reaches the DB.
export const NO_LINKED_VIEW = "none";

// Nav routes an article can be linked to (surfaces the article as a
// "Related article" on that page). Kept separate from nav-items.ts to
// avoid pulling icon components into this dependency-free module.
export const NAV_VIEWS = [
  { value: "/dashboard", label: "Dashboard" },
  { value: "/projects", label: "Projects" },
  { value: "/tasks", label: "Task Board" },
  { value: "/timeline", label: "Timeline" },
  { value: "/reports", label: "Reports" },
  { value: "/documents", label: "Documents" },
  { value: "/risks", label: "Risk Register" },
  { value: "/vendors", label: "Vendors" },
  { value: "/resources", label: "Resources" },
  { value: "/members", label: "Members" },
  { value: "/settings", label: "Settings" },
] as const;
