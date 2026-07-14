"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Pencil, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/auth/submit-button";
import { createResource, updateResource } from "@/lib/actions/resources";
import { RESOURCE_ICON_NAMES, RESOURCE_COLORS } from "./resource-icons";
import type { ResourceItem } from "@/lib/db/resources";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

export function ResourceFormDialog({ resource }: { resource?: ResourceItem }) {
  const [open, setOpen] = useState(false);
  const action = resource ? updateResource : createResource;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: resource ? "outline" : "default", size: "sm" })}>
        {resource ? <><Pencil /> Edit</> : <><Plus /> New Resource</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{resource ? "Edit resource" : "New resource"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {resource && <input type="hidden" name="id" value={resource.id} />}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={resource?.name} placeholder="e.g. Design System" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="icon">Icon</Label>
              <Select name="icon" defaultValue={resource?.icon ?? "Box"}>
                <SelectTrigger id="icon" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_ICON_NAMES.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="progress">Progress (%)</Label>
              <Input id="progress" name="progress" type="number" min={0} max={100} defaultValue={resource?.progress ?? 0} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="detail">Details</Label>
            <Textarea id="detail" name="detail" defaultValue={resource?.detail} placeholder="Notes, scope, owner" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="label">Status label</Label>
              <Input id="label" name="label" defaultValue={resource?.label} placeholder="e.g. In progress" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="color">Color</Label>
              <Select name="color" defaultValue={resource?.color ?? "blue"}>
                <SelectTrigger id="color" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_COLORS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-auto">{resource ? "Save changes" : "Add resource"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
