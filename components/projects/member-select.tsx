"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Member } from "@/lib/db/members";

export function MemberSelect({ members }: { members: Member[] }) {
  return (
    <Select name="memberId" defaultValue={members[0]?.id}>
      <SelectTrigger className="flex-1">
        <SelectValue>{(id: string) => members.find((m) => m.id === id)?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
