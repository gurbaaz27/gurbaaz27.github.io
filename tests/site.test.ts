import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { formatViewCount, makeExcerpt, parsePostId } from "../src/lib/post-utils";

const routes = [
  "index.html",
  "page2/index.html",
  "blog/index.html",
  "aboutme/index.html",
  "projects/index.html",
  "tags/index.html",
  "404.html",
  "feed.xml",
  "robots.txt",
  "sitemap.xml",
  "2020-06-03-5-Ks-of-kakar/index.html",
  "2021-05-30-demystifying-the-docker/index.html",
  "2023-01-16-codrop/index.html",
  "2023-02-20-japan/index.html",
  "2023-03-29-bug-log-1/index.html",
  "2023-09-18-dynamic-arguments-argparse-subparser/index.html",
  "2023-09-18-tally-and-nextjs-app-router/index.html",
  "2025-12-30-starshare-chrome-extension/index.html",
];

describe("post compatibility", () => {
  test("preserves filename date, case, and permalink", () => {
    expect(parsePostId("2020-06-03-5-Ks-of-kakar")).toMatchObject({
      dateKey: "2020-06-03",
      slug: "5-Ks-of-kakar",
      url: "/2020-06-03-5-Ks-of-kakar/",
    });
  });

  test("builds Jekyll-style excerpts and view labels", () => {
    expect(makeExcerpt("Hello **world** from [Gurbaaz](/about).", 3)).toBe("Hello world from…");
    expect(formatViewCount(1)).toBe("1 view");
    expect(formatViewCount(1_200)).toBe("1.2K views");
  });
});

describe("static build", () => {
  test("emits every established public route", () => {
    for (const route of routes) expect(existsSync(`dist/${route}`), route).toBe(true);
    expect(readFileSync("dist/sitemap.xml", "utf8")).toContain("https://gurbaaz.xyz/page2/");
    expect(existsSync("dist/sitemap-index.xml")).toBe(false);
  });

  test("keeps canonical domain and integrations", () => {
    const post = readFileSync("dist/2025-12-30-starshare-chrome-extension/index.html", "utf8");
    expect(post).toContain('rel="canonical" href="https://gurbaaz.xyz/2025-12-30-starshare-chrome-extension/"');
    expect(post).toContain("https://comments.gurbaaz.xyz");
    expect(post).toContain('id="waline"');
    expect(post).not.toContain("utteranc.es/client.js");
    expect(post).toContain("upvote-btn");
    expect(post).toContain("firebase.initializeApp");
  });

  test("keeps same-date posts in the established display order", () => {
    const home = readFileSync("dist/index.html", "utf8");
    expect(home.indexOf("tally-and-nextjs-app-router")).toBeLessThan(home.indexOf("dynamic-arguments-argparse-subparser"));
    expect(home).not.toContain("Powered by");
  });

  test("publishes eight posts and excludes drafts", () => {
    const feed = readFileSync("dist/feed.xml", "utf8");
    expect((feed.match(/<item>/g) ?? []).length).toBe(8);
    expect(feed).not.toContain("Sample blog post");
    expect(feed).not.toContain("The Pain of Deployment");
    expect(feed).not.toContain("Treading the tales of Turban");
  });
});
