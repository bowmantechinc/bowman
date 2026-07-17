"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteAttachment } from "@/lib/actions/attachments";

export function DeleteDocumentButton({ id, projectId }: { id: string; projectId: string }) {
  return (
    <ConfirmDeleteButton action={deleteAttachment.bind(null, id, projectId)} confirmMessage="Delete this file?" />
  );
}
