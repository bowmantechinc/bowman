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
import { SubmitButton } from "@/components/auth/submit-button";
import { createArticle, updateArticle } from "@/lib/actions/knowledge";
import type { KnowledgeArticle } from "@/lib/db/knowledge";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import { useCloseOnSuccess } from "@/hooks/use-close-on-success";

export function ArticleFormDialog({ article }: { article?: KnowledgeArticle }) {
  const [open, setOpen] = useState(false);
  const action = article ? updateArticle : createArticle;
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={article ? "Edit article" : undefined}
        className={buttonVariants({ variant: article ? "outline" : "default", size: article ? "icon-sm" : "sm" })}
      >
        {article ? <Pencil /> : <><Plus /> New Article</>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{article ? "Edit article" : "New knowledge base article"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          {article && <input type="hidden" name="id" value={article.id} />}
          {state?.error && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required defaultValue={article?.title} placeholder="e.g. Client onboarding checklist" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Content</Label>
            <Textarea
              id="body"
              name="body"
              defaultValue={article?.body}
              className="min-h-32 font-mono text-[13px]"
              placeholder="Write the guide here… (tip: this field is monospace, handy for diagrams)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" name="tags" defaultValue={article?.tags.join(", ")} placeholder="comma, separated, tags" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedView">Related page (optional)</Label>
              <Input id="linkedView" name="linkedView" defaultValue={article?.linkedView} placeholder="e.g. /projects" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton className="w-auto">{article ? "Save changes" : "Publish article"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
