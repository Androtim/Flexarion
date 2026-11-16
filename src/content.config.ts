import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const devlogs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/devlogs" }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    authorRole: z.string(),
    tag: z.string(),
    readingTime: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    summaryPoints: z.array(z.string()),
  }),
});

export const collections = { devlogs };
