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
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import type { Vendor } from "@/lib/db/vendors";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

const SUPPORT_LEVELS = ["Standard", "Premium", "Enterprise"];

export function VendorFormDialog({ vendor }: { vendor?: Vendor }) {
  const [open, setOpen] = useState(false);
  const action = vendor ? updateVendor : createVendor;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: vendor ? "outline" : "default", size: "sm" })}>
        {vendor ? <><Pencil /> Edit</> : <><Plus /> New Vendor</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit vendor" : "New vendor"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {vendor && <input type="hidden" name="id" value={vendor.id} />}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Vendor name</Label>
            <Input id="name" name="name" required defaultValue={vendor?.name} placeholder="e.g. Acme Cloud" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact person</Label>
              <Input id="contact" name="contact" defaultValue={vendor?.contact} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Contact email</Label>
              <Input id="email" name="email" type="email" defaultValue={vendor?.email} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="licenseStart">License start</Label>
              <Input id="licenseStart" name="licenseStart" type="date" defaultValue={vendor?.licenseStart} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licenseEnd">License expiry</Label>
              <Input id="licenseEnd" name="licenseEnd" type="date" defaultValue={vendor?.licenseEnd} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supportLevel">Support level</Label>
            <Select name="supportLevel" defaultValue={vendor?.supportLevel ?? "Standard"}>
              <SelectTrigger id="supportLevel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_LEVELS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={vendor?.notes} placeholder="License terms, renewal reminders, etc." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-auto">{vendor ? "Save changes" : "Add vendor"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
