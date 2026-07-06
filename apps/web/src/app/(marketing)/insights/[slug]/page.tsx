import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BLOG, getPost } from "@/modules/marketing/content";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return BLOG.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found — PropAI" };
  return { title: `${post.title} — PropAI`, description: post.excerpt };
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="pt-24 pb-20 sm:pt-28">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <Link
          href="/insights"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All insights
        </Link>

        <div className="mt-8 flex items-center gap-2 text-xs tracking-wide uppercase">
          <span className="text-primary font-semibold">{post.category}</span>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <time className="text-muted-foreground" dateTime={post.date}>
            {post.readableDate}
          </time>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <span className="text-muted-foreground">{post.readingTime}</span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-[2.75rem] sm:leading-[1.1]">
          {post.title}
        </h1>
      </div>

      <div className="mx-auto mt-10 aspect-[16/9] w-full max-w-4xl overflow-hidden px-0 sm:rounded-3xl sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.src}
          alt=""
          className="h-full w-full object-cover sm:rounded-3xl"
        />
      </div>

      <div className="mx-auto mt-12 w-full max-w-3xl px-4 sm:px-6">
        <div className="space-y-6 text-lg leading-relaxed text-pretty">
          {post.body.map((paragraph, i) => (
            <p key={i} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>
              {paragraph}
            </p>
          ))}
        </div>

        <div className="border-border mt-14 flex flex-col items-start gap-4 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-medium text-balance">
            See what PropAI can do for your brokerage.
          </p>
          <Link
            href="/contact"
            className={cn(buttonVariants({ size: "lg" }), "shrink-0 rounded-full")}
          >
            Request a demo
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
