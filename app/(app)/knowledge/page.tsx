import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToneBadge } from "@/components/tone-badge";
import { BookOpen, Search } from "lucide-react";
import { ArticleFormDialog } from "@/components/knowledge/article-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteArticle } from "@/lib/actions/knowledge";
import { knowledgeRepo } from "@/lib/db/knowledge";
import { RelatedArticlesCard } from "@/components/knowledge/related-articles-card";

export const metadata: Metadata = { title: "Knowledge Base" };

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const articles = await knowledgeRepo.list();

  const query = (q ?? "").toLowerCase().trim();
  const filtered = query
    ? articles.filter((a) =>
        [a.title, a.body, ...a.tags].join(" ").toLowerCase().includes(query)
      )
    : articles;

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description={`${articles.length} article${articles.length === 1 ? "" : "s"}`}
        actions={<ArticleFormDialog />}
      />

      <RelatedArticlesCard view="/knowledge" />

      <form method="get" className="relative mb-5 max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input name="q" defaultValue={q} placeholder="Search articles…" className="pl-8" />
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={query ? "No articles found" : "No articles yet"}
          description={query ? "Try a different search term." : "Write your first guide for the team."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link href={`/knowledge/${a.id}`} className="font-medium hover:underline">
                    {a.title}
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <ArticleFormDialog article={a} />
                    <ConfirmDeleteButton action={deleteArticle.bind(null, a.id)} confirmMessage="Delete this article?" />
                  </div>
                </div>
                {a.body && (
                  <Link href={`/knowledge/${a.id}`} className="block">
                    <p className="text-muted-foreground line-clamp-4 text-sm whitespace-pre-wrap">{a.body}</p>
                  </Link>
                )}
                {a.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <ToneBadge key={t} tone="gray">
                        {t}
                      </ToneBadge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
