import "server-only";
import type { TableSchema as TabSchema } from "@/lib/db/d1-repo";

export const MEMBERS_SCHEMA: TabSchema = {
  name: "Members",
  headers: [
    "id",
    "name",
    "email",
    "passwordHash",
    "role",
    "labelId",
    "initials",
    "color",
    "textColor",
    "createdAt",
  ],
};

export const ROLES_SCHEMA: TabSchema = {
  name: "Roles",
  headers: ["id", "label"],
};

export const LABELS_SCHEMA: TabSchema = {
  name: "Labels",
  headers: ["id", "name", "color"],
};

export const PROJECTS_SCHEMA: TabSchema = {
  name: "Projects",
  headers: [
    "id",
    "name",
    "description",
    "ownerId",
    "memberIds",
    "color",
    "stage",
    "startDate",
    "dueDate",
    "createdAt",
  ],
};

export const TASKS_SCHEMA: TabSchema = {
  name: "Tasks",
  headers: [
    "id",
    "title",
    "description",
    "labelId",
    "priority",
    "startDate",
    "dueDate",
    "ownerId",
    "projectId",
    "status",
    "createdAt",
  ],
};

export const TASK_COMMENTS_SCHEMA: TabSchema = {
  name: "TaskComments",
  headers: ["id", "taskId", "authorId", "text", "createdAt"],
};

export const RISKS_SCHEMA: TabSchema = {
  name: "Risks",
  headers: [
    "id",
    "projectId",
    "description",
    "category",
    "likelihood",
    "impact",
    "level",
    "ownerId",
    "mitigation",
    "createdAt",
  ],
};

export const VENDORS_SCHEMA: TabSchema = {
  name: "Vendors",
  headers: [
    "id",
    "name",
    "contact",
    "email",
    "licenseStart",
    "licenseEnd",
    "supportLevel",
    "notes",
  ],
};

export const RESOURCES_SCHEMA: TabSchema = {
  name: "Resources",
  headers: ["id", "name", "icon", "detail", "progress", "color", "label"],
};

export const ATTACHMENTS_SCHEMA: TabSchema = {
  name: "Attachments",
  headers: [
    "id",
    "projectId",
    "name",
    "mimeType",
    "size",
    "storagePath",
    "publicUrl",
    "uploadedBy",
    "createdAt",
  ],
};

export const INVITES_SCHEMA: TabSchema = {
  name: "Invites",
  headers: [
    "id",
    "email",
    "role",
    "labelId",
    "projectId",
    "invitedBy",
    "status",
    "createdAt",
  ],
};

export const ACTIVITY_SCHEMA: TabSchema = {
  name: "Activity",
  headers: ["id", "icon", "text", "actorId", "createdAt"],
};

export const KNOWLEDGE_SCHEMA: TabSchema = {
  name: "KnowledgeArticles",
  headers: ["id", "title", "body", "tags", "linkedView", "createdBy", "updatedAt"],
};

export const NOTIFICATIONS_SCHEMA: TabSchema = {
  name: "Notifications",
  headers: [
    "id",
    "memberId",
    "projectId",
    "taskId",
    "type",
    "title",
    "body",
    "url",
    "read",
    "createdAt",
  ],
};

export const PUSH_SUBSCRIPTIONS_SCHEMA: TabSchema = {
  name: "PushSubscriptions",
  headers: ["id", "memberId", "endpoint", "p256dh", "auth", "createdAt"],
};

export const ALL_SCHEMAS: TabSchema[] = [
  MEMBERS_SCHEMA,
  ROLES_SCHEMA,
  LABELS_SCHEMA,
  PROJECTS_SCHEMA,
  TASKS_SCHEMA,
  TASK_COMMENTS_SCHEMA,
  RISKS_SCHEMA,
  VENDORS_SCHEMA,
  RESOURCES_SCHEMA,
  ATTACHMENTS_SCHEMA,
  INVITES_SCHEMA,
  ACTIVITY_SCHEMA,
  KNOWLEDGE_SCHEMA,
  NOTIFICATIONS_SCHEMA,
  PUSH_SUBSCRIPTIONS_SCHEMA,
];
