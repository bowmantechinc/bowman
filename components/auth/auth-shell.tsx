import { Compass } from "lucide-react";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-5" />
          </div>
          <div>
            <div className="text-base leading-none font-semibold">{SITE_NAME}</div>
            <div className="text-muted-foreground text-xs">{SITE_TAGLINE}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
