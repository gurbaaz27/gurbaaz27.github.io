import type { APIContext } from "astro";
import { getPosts, PAGE_SIZE } from "../lib/posts";

export async function GET({ site }: APIContext) {
  const posts = await getPosts();
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const pageLinks = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => `/page${index + 2}/`);
  const paths = ["/", "/aboutme/", "/blog/", ...pageLinks, "/projects/", "/tags/", ...posts.map((post) => post.url)];
  const urls = paths.map((path) => `<url><loc>${new URL(path, site)}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml" },
  });
}
