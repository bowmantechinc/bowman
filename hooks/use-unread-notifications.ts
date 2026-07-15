"use client";

import { useEffect, useState } from "react";
import { getMyNotifications } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/db/notifications";

const POLL_MS = 30_000;

export function useUnreadNotifications(initial: Notification[]) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      getMyNotifications().then(setItems).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return [items, setItems] as const;
}
