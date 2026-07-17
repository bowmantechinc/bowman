import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { knowledgeRepo } from "@/lib/db/knowledge";
import { cn } from "@/lib/utils";

export async function RelatedArticlesCard({ view, className }: { view: string; className?: string }) {
  const articles = await knowledgeRepo.list();
  const related = articles.filter((a) => a.linkedView === view);

  if (related.length === 0) return null;

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <BookOpen className="size-3.5" />
          Related articles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {related.map((a) => (
          <Link
            key={a.id}
            href={`/knowledge/${a.id}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span className="truncate">{a.title}</span>
            <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
