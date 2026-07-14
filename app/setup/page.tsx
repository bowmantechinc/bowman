import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { BootstrapForm } from "@/components/auth/bootstrap-form";
import { membersRepo } from "@/lib/db/members";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Set up · ${SITE_NAME}` };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const members = await membersRepo.list();
  if (members.length > 0) redirect("/login");

  return (
    <AuthShell
      title="Create your admin account"
      description="Your Google Sheet is empty. Set up the first admin account, then invite your team from Settings."
    >
      <BootstrapForm />
    </AuthShell>
  );
}
