"use client";

import { useActionState, useRef, useEffect } from "react";
import { AlertCircle, Paperclip, Trash2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { uploadAttachment, deleteAttachment } from "@/lib/actions/attachments";
import { INITIAL_ACTION_STATE } from "@/lib/actions/types";
import type { Attachment } from "@/lib/db/attachments";

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function AttachmentsCard({ projectId, attachments }: { projectId: string; attachments: Attachment[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(uploadAttachment, INITIAL_ACTION_STATE);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form ref={formRef} action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <Input type="file" name="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.csv" className="flex-1" />
          <SubmitButton className="w-auto">
            <Paperclip className="size-3.5" /> Upload
          </SubmitButton>
        </form>
        {state?.error && (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md px-3 py-2 text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
        {attachments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No files attached yet.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm"
              >
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <a href={a.driveUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:underline">
                  {a.name}
                </a>
                <span className="text-muted-foreground shrink-0 text-xs">{formatBytes(a.size)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteAttachment(a.id, projectId)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
