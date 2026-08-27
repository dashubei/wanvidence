/**
 * sitemap.xml を手書きのエンドポイントで作る。
 *
 * なぜ @astrojs/sitemap を使わないか:
 *   依存を増やせない（package.json は別の担当）。それに、この本の sitemap は
 *   「draft を除く」「lastmod は frontmatter の updated から」という固有のルールがあり、
 *   汎用の生成器に寄せるより 40 行書いたほうが読める。
 *
 * 入れないもの:
 *   - /search: 全文検索の入力欄しかないページ。中身が無いので索引に入れる価値がない
 *     （BaseLayout 側で noindex にする想定。パッチは報告に書いた）
 *   - /llms.txt, /robots.txt: sitemap は HTML ページの一覧
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absoluteUrl } from '../lib/seo';

/** YYYY-MM-DD だけを通す。書式が違うものは lastmod を付けない（嘘を書かないため） */
const isDate = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const chapters = (await getCollection('chapters'))
    .filter((c) => !c.data.draft && !c.id.startsWith('_'))
    .sort((a, b) => a.data.partOrder - b.data.partOrder || a.data.order - b.data.order);

  // 付録とトップページは章から生成されるので、最も新しい章の更新日を使う
  const dates = chapters
    .map((c) => c.data.updated)
    .filter(isDate)
    .sort();
  const newest = dates[dates.length - 1];

  const entries: { path: string; lastmod?: string }[] = [
    { path: '/', lastmod: newest },
    // /legend は手書きのページ。更新日を持っていないので lastmod を付けない
    { path: '/legend' },
    { path: '/appendix/disputed', lastmod: newest },
    { path: '/appendix/glossary', lastmod: newest },
    { path: '/appendix/sources', lastmod: newest },
    ...chapters.map((c) => ({
      path: `/chapters/${c.id}`,
      lastmod: isDate(c.data.updated) ? c.data.updated : undefined,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((e) => {
    const loc = `    <loc>${escapeXml(absoluteUrl(e.path, site))}</loc>`;
    const mod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '';
    return `  <url>\n${loc}${mod}\n  </url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
