"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project } from "@/lib/db/projects";

export function ProjectPicker({ projects, selectedId }: { projects: Project[]; selectedId: string }) {
  const router = useRouter();

  return (
    <Select value={selectedId} onValueChange={(id) => router.push(`/reports?project=${id}`)}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Choose a project">
          {(id: string) => projects.find((p) => p.id === id)?.name ?? "Choose a project"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
