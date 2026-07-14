"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemberAvatar } from "@/components/member-avatar";
import { logoutAction } from "@/lib/actions/auth";

export function UserMenu({
  name,
  email,
  role,
  initials,
  color,
  textColor,
}: {
  name: string;
  email: string;
  role: string;
  initials: string;
  color: string;
  textColor: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none hover:bg-accent">
        <MemberAvatar name={name} initials={initials} color={color} textColor={textColor} size={28} />
        <div className="hidden text-left sm:block">
          <div className="text-sm leading-none font-medium">{name}</div>
          <div className="text-muted-foreground mt-0.5 text-[11px] leading-none capitalize">{role}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-muted-foreground truncate text-xs">{email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
