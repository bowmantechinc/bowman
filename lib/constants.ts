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
