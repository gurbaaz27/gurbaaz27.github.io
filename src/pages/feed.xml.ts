import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../lib/posts";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: "Gurbaaz Singh",
    description: "Thank You for visiting my homepage.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.entry.data.title,
      description: post.entry.data.subtitle || post.excerpt,
      pubDate: post.date,
      link: post.url,
    })),
  });
}
