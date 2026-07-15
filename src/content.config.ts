import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional().default(""),
    "thumbnail-img": z.string().optional(),
    "share-img": z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    minutes_to_read: z.number().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
