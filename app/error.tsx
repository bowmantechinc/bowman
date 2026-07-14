"use client";

import { useEffect } from "react";
import { AlertTriangle, Compass, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isMissingCredentials = error.message.includes("Missing Google service account env vars");

  useEffect(() => {
    if (!isMissingCredentials) console.error(error);
  }, [error, isMissingCredentials]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-5" />
          </div>
          <div className="text-base font-semibold">{SITE_NAME}</div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-5" />
            <h1 className="text-lg font-semibold tracking-tight">
              {isMissingCredentials ? "Google Sheets isn't connected yet" : "Something went wrong"}
            </h1>
          </div>
          {isMissingCredentials ? (
            <div className="text-muted-foreground space-y-2 text-sm">
              <p>This app uses a Google Sheet as its database. To finish setup:</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Create a Google Cloud service account and enable the Sheets + Drive APIs.</li>
                <li>Share your target spreadsheet with the service account&apos;s email as an Editor.</li>
                <li>
                  Copy <code className="bg-muted rounded px-1 py-0.5 text-xs">.env.local.example</code> to{" "}
                  <code className="bg-muted rounded px-1 py-0.5 text-xs">.env.local</code> and fill in the values.
                </li>
                <li>
                  Run <code className="bg-muted rounded px-1 py-0.5 text-xs">npm run setup</code> to create the sheet
                  tabs.
                </li>
              </ol>
              <p>Full instructions are in the project README.</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{error.message}</p>
          )}
          <Button onClick={reset} variant="outline" className="mt-4">
            <RotateCw className="size-3.5" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
