import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { membersRepo } from "@/lib/db/members";
import { getSession } from "@/lib/auth/session";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Sign in · ${SITE_NAME}` };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const members = await membersRepo.list();
  if (members.length === 0) redirect("/setup");

  return (
    <AuthShell title="Sign in" description="Welcome back. Enter your credentials to continue.">
      <LoginForm />
    </AuthShell>
  );
}
