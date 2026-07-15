"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { enableDesktopNotifications } from "@/components/notifications/push-subscribe";
import type { Notification } from "@/lib/db/notifications";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useUnreadNotifications(initial);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const unreadCount = items.filter((n) => !n.read).length;

  async function handleEnable() {
    const result = await enableDesktopNotifications();
    if (result !== "unsupported") setPermission(result);
  }

  async function handleItemClick(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationRead(id).catch(() => {});
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex size-8 items-center justify-center rounded-md outline-none hover:bg-accent">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between font-normal">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-muted-foreground text-xs hover:text-foreground"
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {permission === "default" && (
          <>
            <DropdownMenuSeparator />
            <div className="px-1.5 py-1.5">
              <Button size="sm" variant="secondary" className="w-full" onClick={handleEnable}>
                <BellRing className="size-3.5" />
                Turn on desktop notifications
              </Button>
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="text-muted-foreground px-1.5 py-4 text-center text-xs">No notifications yet.</p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0.5 whitespace-normal"
              onClick={() => handleItemClick(n.id)}
              render={<Link href={n.url} />}
            >
              <span className="flex w-full items-center gap-1.5 text-sm font-medium">
                {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />}
                {n.title}
              </span>
              <span className="text-muted-foreground line-clamp-2 text-xs">{n.body}</span>
              <span className="text-muted-foreground text-[11px]">{timeAgo(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
