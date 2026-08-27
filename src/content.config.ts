import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 章コレクション。
 * part は「部」（第1部 決める前に、など）、order は全体を通した並び順。
 */
const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    // 一覧やナビで使う短い見出し（省略時は title を使う）
    navTitle: z.string().optional(),
    part: z.string(),
    partOrder: z.number(),
    order: z.number(),
    // 章カードに出す1〜2文の要約
    summary: z.string(),
    // Lucide のアイコン名（PascalCase）
    icon: z.string().default('BookOpen'),
    // この章を読むべき人・場面
    audience: z.string().optional(),
    // 最終更新日
    updated: z.string().optional(),
    // 下書き中は一覧から隠す
    draft: z.boolean().default(false),
  }),
});

export const collections = { chapters };
