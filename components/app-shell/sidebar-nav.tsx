"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { NAV_SECTIONS } from "./nav-items";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

export function SidebarNav({ role, className }: { role: string; className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-56 shrink-0 flex-col bg-zinc-950 text-white", className)}>
      <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Compass className="size-4" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-white">{SITE_NAME}</div>
          <div className="truncate text-[11px] text-white/40">Project Management</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.adminOnly || role === "admin");
          if (!items.length) return null;
          return (
            <div key={section.label} className="mb-2">
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-white/30 uppercase">
                {section.label}
              </div>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "mx-2 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/85",
                      active && "bg-white/10 text-white"
                    )}
                  >
                    <Icon className="size-[15px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
