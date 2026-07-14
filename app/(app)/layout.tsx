import { requireSession } from "@/lib/auth/dal";
import { membersRepo } from "@/lib/db/members";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { UserMenu } from "@/components/app-shell/user-menu";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const member = await membersRepo.get(session.sub);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav role={session.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-13 shrink-0 items-center justify-end gap-2 border-b px-4">
          <ThemeToggle />
          <UserMenu
            name={session.name}
            email={session.email}
            role={session.role}
            initials={member?.initials ?? "?"}
            color={member?.color ?? "#dbeafe"}
            textColor={member?.textColor ?? "#1d4ed8"}
          />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
