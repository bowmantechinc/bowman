import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export const ADMIN_ROLES = ["admin", "lead"] as const;

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") redirect("/dashboard");
  return session;
}

export function isManager(role: string): boolean {
  return role === "admin" || role === "lead";
}
