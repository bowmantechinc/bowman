/**
 * Seed script: adds one Knowledge Base article per primary navigation item,
 * documenting its functionality and workflow. Each article's `linkedView` is
 * set to the matching nav path so it appears on that page's Related Articles card.
 *
 * Run with:
 *   CLOUDFLARE_API_TOKEN=... npm run db:seed:knowledge
 * (or just `node scripts/seed-knowledge.mjs` from the project root — it shells out to wrangler).
 */

const ARTICLES = [
  {
    title: "Dashboard — Functionality & Workflow",
    linkedView: "/dashboard",
    tags: ["dashboard", "overview", "getting started"],
    body: `The Dashboard is your at-a-glance command center.

FUNCTIONALITY
- Shows summary widgets for active projects, open tasks, upcoming due dates, risks, and overdue items.
- Surfaces recent activity and notifications across the workspace.
- Provides quick links into Projects, Tasks, Risks, and Reports.

WORKFLOW
1. Sign in — you land on the Dashboard automatically.
2. Review the widgets to spot overdue tasks, high-severity risks, or stalled projects.
3. Click any summary card or quick link to drill into the relevant module.
4. Use the notifications bell (top-right) to catch assignments and mentions.

TIP: The Dashboard is read-only insight. Create and edit data from the dedicated modules.`,
  },
  {
    title: "Projects — Functionality & Workflow",
    linkedView: "/projects",
    tags: ["projects", "portfolio", "planning"],
    body: `Projects are the top-level containers that group tasks, risks, members, and documents.

FUNCTIONALITY
- Create, edit, and archive projects (Admin/Lead only).
- Track stage, owner, start/due dates, and member roster per project.
- Drill into a project to see its tasks, risks, members, and attachments.

WORKFLOW
1. Click "New Project" (Admins/Leads) and fill in name, description, stage, owner, and dates.
2. Open the project detail page to add members (Admin/Lead) and attach files.
3. Use "Open task board" / "Open risk register" to manage the project's work.
4. Update the stage and dates as the project progresses; the Dashboard reflects changes.

TIP: Assign a clear owner so the project appears under their purview and notifications route correctly.`,
  },
  {
    title: "Knowledge Base — Functionality & Workflow",
    linkedView: "/knowledge",
    tags: ["knowledge", "wiki", "guides"],
    body: `The Knowledge Base is the team's shared wiki of guides and reference articles.

FUNCTIONALITY
- Browse and search all articles by title, body, and tags.
- Create, edit, and delete articles.
- Link an article to a navigation page so it shows up in that page's "Related articles" card.

WORKFLOW
1. Click "New Article" and enter a title, body, and comma-separated tags.
2. Set "Related page (optional)" to a nav path (e.g. /tasks) to surface it contextually.
3. Save — the article appears in search and on its linked page.
4. Use the edit/delete buttons on each card to maintain content.

TIP: Tag articles consistently (e.g. "workflow", "setup") so related guides cluster together.`,
  },
  {
    title: "Task Board — Functionality & Workflow",
    linkedView: "/tasks",
    tags: ["tasks", "kanban", "workflow"],
    body: `The Task Board is a Kanban view of all tasks across projects, organized by status.

FUNCTIONALITY
- Four columns (Backlog, In Progress, Review, Done) with drag-and-drop between them.
- Filter by project and by label.
- Create tasks, open the detail drawer, edit, and comment.
- Delete tasks — Admin/Lead only.

WORKFLOW
1. Click "New Task" and set title, description, project, assignee, label, priority, dates, stage, and progress.
2. Drag a card to a new column to change its status (progress auto-updates to 100% on Done).
3. Click a card to open the detail drawer: view metadata, add comments, and edit or delete.
4. Use the label/project filter chips to focus the board.

TIP: Commenting notifies project members and keeps context with the task.`,
  },
  {
    title: "Timeline — Functionality & Workflow",
    linkedView: "/timeline",
    tags: ["timeline", "schedule", "gantt"],
    body: `The Timeline gives a chronological, schedule-oriented view of work across projects.

FUNCTIONALITY
- Visualizes task start/due dates on a time axis.
- Highlights overdue and upcoming work.
- Filters by project to narrow the view.

WORKFLOW
1. Open Timeline to see tasks plotted by their start and due dates.
2. Use the project filter to focus on a single initiative.
3. Cross-reference with the Task Board to adjust dates when the timeline shows bottlenecks.

TIP: Keep task start/due dates accurate — the Timeline and Dashboard both depend on them.`,
  },
  {
    title: "Reports — Functionality & Workflow",
    linkedView: "/reports",
    tags: ["reports", "analytics", "export"],
    body: `Reports aggregate workspace data into shareable analytics and exports.

FUNCTIONALITY
- Summarizes tasks, projects, risks, and progress.
- Supports printing/export for stakeholder updates.
- Print-friendly layout (hides navigation automatically).

WORKFLOW
1. Open Reports to view the compiled metrics.
2. Adjust any available filters to scope the data.
3. Use the browser's print/export to PDF for distribution.

TIP: Reports pull live data, so generate them right before a review for the freshest numbers.`,
  },
  {
    title: "Documents — Functionality & Workflow",
    linkedView: "/documents",
    tags: ["documents", "files", "attachments"],
    body: `Documents is the global file vault for project attachments stored in R2.

FUNCTIONALITY
- Browse all uploaded files across projects.
- Download and delete files (project members only for project-scoped files).
- Files are linked to the project they belong to.

WORKFLOW
1. Upload files from a Project's detail page (Attachments section).
2. Open Documents to see everything in one place.
3. Download or delete as needed; deletions remove the object from storage.

TIP: Large or sensitive files belong here rather than inline in task comments.`,
  },
  {
    title: "Risk Register — Functionality & Workflow",
    linkedView: "/risks",
    tags: ["risks", "risk register", "mitigation"],
    body: `The Risk Register tracks potential issues that could impact projects.

FUNCTIONALITY
- Log risks with description, severity level, and owner.
- Filter and triage by project.
- Delete risks when resolved (Admins/Leads).

WORKFLOW
1. Click "New Risk" and describe the risk, set its level (Low/Medium/High), and assign an owner.
2. Review the register regularly to prioritize mitigation.
3. When a risk is resolved, delete it or note the resolution in its description.

TIP: Pair each high-severity risk with a concrete owner and review cadence.`,
  },
  {
    title: "Vendors — Functionality & Workflow",
    linkedView: "/vendors",
    tags: ["vendors", "suppliers", "procurement"],
    body: `Vendors tracks external suppliers and service providers.

FUNCTIONALITY
- Maintain a directory of vendors with contact and category details.
- Link vendors to projects where relevant.
- Add and delete vendor records.

WORKFLOW
1. Click "New Vendor" and enter name, category, contact, and notes.
2. Reference vendors when planning procurement for a project.
3. Delete outdated vendor entries to keep the list clean.

TIP: Use consistent categories (e.g. "Cloud", "Legal") so the list stays filterable.`,
  },
  {
    title: "Resources — Functionality & Workflow",
    linkedView: "/resources",
    tags: ["resources", "capacity", "assets"],
    body: `Resources manages internal assets, equipment, and capacity assigned to work.

FUNCTIONALITY
- Catalog resources with type, availability, and assignment.
- Track what is allocated to which project.
- Add and remove resource entries.

WORKFLOW
1. Click "New Resource" and describe the resource and its status.
2. Assign or note allocation to projects as needed.
3. Keep availability current so planning reflects reality.

TIP: Treat Resources as your capacity ledger — review before committing to new timelines.`,
  },
  {
    title: "Members — Functionality & Workflow",
    linkedView: "/members",
    tags: ["members", "team", "roles"],
    body: `Members manages the people in your workspace and their roles.

FUNCTIONALITY
- View all members with avatars, roles, and assignments.
- Invite new members and assign roles (Admin/Lead only).
- Remove members from projects and delete member records (Admin/Lead only).

WORKFLOW
1. Admins/Leads click "Invite" to add a member and set their role (admin/lead/member).
2. Assign members to projects from the project detail page.
3. Monitor role distribution to keep the right people with the right access.

TIP: Roles drive access — only admins can reach Settings; admins and leads can create/edit/delete core entities.`,
  },
  {
    title: "Settings — Functionality & Workflow",
    linkedView: "/settings",
    tags: ["settings", "configuration", "admin"],
    body: `Settings is the admin-only configuration area for the workspace.

FUNCTIONALITY
- Manage workspace-level configuration (Admin only).
- Configure roles/labels and integration settings.
- Control environment variables and feature toggles.

WORKFLOW
1. Open Settings (visible only to Admins).
2. Adjust the available configuration options as your team's needs evolve.
3. Save changes; they apply across the workspace.

TIP: Settings changes are global — coordinate with other admins before altering shared configuration.`,
  },
];

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

function buildInsert(a) {
  const id = `kb_seed_${a.linkedView.replace(/\//g, "_")}`;
  const now = new Date().toISOString();
  return `INSERT OR IGNORE INTO "KnowledgeArticles" ("id","title","body","tags","linkedView","createdBy","updatedAt") VALUES ('${id}','${escapeSql(
    a.title
  )}','${escapeSql(a.body)}','${a.tags.join("|")}','${a.linkedView}','System','${now}');`;
}

const sql = ARTICLES.map(buildInsert).join("\n");

import { execFileSync } from "node:child_process";

try {
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "bowman_app_db", "--remote", "--command", sql],
    { stdio: "inherit", env: process.env }
  );
  console.log(`Seeded ${ARTICLES.length} knowledge articles.`);
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exit(1);
}
