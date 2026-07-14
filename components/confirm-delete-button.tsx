"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  confirmMessage = "Are you sure? This can't be undone.",
  size = "icon-sm",
}: {
  action: () => void | Promise<void>;
  confirmMessage?: string;
  size?: "icon-sm" | "sm";
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      aria-label={size === "icon-sm" ? "Delete" : undefined}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (window.confirm(confirmMessage)) action();
      }}
    >
      <Trash2 className="size-3.5" />
      {size === "sm" && "Delete"}
    </Button>
  );
}
