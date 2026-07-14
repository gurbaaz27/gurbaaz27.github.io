const WORDS_PER_EXCERPT = 50;

export function parsePostId(id: string) {
  const clean = id.replace(/\.md$/, "").split("/").pop() ?? id;
  const match = clean.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (!match) throw new Error(`Post filename must start with YYYY-MM-DD: ${id}`);
  return {
    dateKey: match[1],
    date: new Date(`${match[1]}T00:00:00+05:30`),
    slug: match[2],
    url: `/${match[1]}-${match[2]}/`,
  };
}

export function makeExcerpt(body = "", length = WORDS_PER_EXCERPT) {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>|{}%-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain.split(" ");
  return `${words.slice(0, length).join(" ")}${words.length > length ? "…" : ""}`;
}

export function formatViewCount(count: number) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} ${count === 1 ? "view" : "views"}`;
}
