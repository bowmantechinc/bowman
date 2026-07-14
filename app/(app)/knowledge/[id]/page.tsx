import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ToneBadge } from "@/components/tone-badge";
import { buttonVariants } from "@/components/ui/button";
import { ArticleFormDialog } from "@/components/knowledge/article-form-dialog";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteArticle } from "@/lib/actions/knowledge";
import { knowledgeRepo } from "@/lib/db/knowledge";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await knowledgeRepo.get(id);
  return { title: article?.title ?? "Article" };
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await knowledgeRepo.get(id);
  if (!article) notFound();

  return (
    <div>
      <Link
        href="/knowledge"
        className="text-muted-foreground mb-4 inline-flex items-center gap-1.5 text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Knowledge Base
      </Link>

      <PageHeader
        title={article.title}
        description={`Last updated ${new Date(article.updatedAt).toLocaleDateString()} by ${article.createdBy}`}
        actions={
          <>
            <ArticleFormDialog article={article} />
            <ConfirmDeleteButton size="sm" action={deleteArticle.bind(null, article.id)} confirmMessage="Delete this article?" />
          </>
        }
      />

      {article.tags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {article.tags.map((t) => (
            <ToneBadge key={t} tone="gray">
              {t}
            </ToneBadge>
          ))}
        </div>
      )}

      <Card>
        <CardContent>
          <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{article.body}</pre>
        </CardContent>
      </Card>

      {article.linkedView && (
        <Link
          href={article.linkedView}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
        >
          Open {article.linkedView}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
