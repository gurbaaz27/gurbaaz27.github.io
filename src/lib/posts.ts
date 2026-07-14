import { getCollection, type CollectionEntry } from "astro:content";
import { makeExcerpt, parsePostId } from "./post-utils";

export { formatViewCount, makeExcerpt, parsePostId } from "./post-utils";

export type BlogEntry = CollectionEntry<"blog">;

export interface Post {
  entry: BlogEntry;
  date: Date;
  dateKey: string;
  slug: string;
  url: string;
  excerpt: string;
}

export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection("blog", ({ data }) => !data.draft);
  return entries
    .map((entry) => ({ entry, ...parsePostId(entry.id), excerpt: makeExcerpt(entry.body) }))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf() || b.slug.localeCompare(a.slug));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
