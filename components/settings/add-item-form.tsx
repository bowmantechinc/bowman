"use client";

import { useActionState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/actions/types";

export function AddItemForm({
  action,
  fieldName,
  placeholder,
  buttonLabel,
}: {
  action: (prevState: ActionState | undefined, formData: FormData) => Promise<ActionState>;
  fieldName: string;
  placeholder: string;
  buttonLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(action, INITIAL_ACTION_STATE);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-2">
      <form ref={formRef} action={formAction} className="flex gap-2">
        <Input name={fieldName} placeholder={placeholder} className="flex-1" />
        <SubmitButton className="w-auto">{buttonLabel}</SubmitButton>
      </form>
      {state?.error && (
        <div className="text-destructive flex items-center gap-1.5 text-xs">
          <AlertCircle className="size-3.5 shrink-0" />
          {state.error}
        </div>
      )}
    </div>
  );
}
