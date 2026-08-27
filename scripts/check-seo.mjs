#!/usr/bin/env node
/**
 * ビルド結果の SEO 検証。`node scripts/check-seo.mjs` で実行する。
 *
 * 手で書いた JSON-LD と sitemap は静かに壊れる（JSON として妥当でも
 * 型やプロパティが間違っていることに気づけない）。だからビルド後の
 * dist/ を実際に読んで確かめる。
 *
 * 見るもの:
 *   1. sitemap.xml — 件数、絶対 URL か、lastmod の書式、章の本数と一致するか
 *   2. robots.txt  — Sitemap 行が絶対 URL か、AI クローラの記述があるか
 *   3. llms.txt    — llmstxt.org の形式（H1 と引用）を満たすか
 *   4. JSON-LD     — dist の全 HTML から抜き出して JSON.parse し、
 *                    @context / @graph / 必須プロパティ / @id の解決を検証
 *   5. head        — canonical・description・robots・title の重複と欠落
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const CONTENT = 'src/content/chapters';

let errors = 0;
let warnings = 0;
const fail = (msg) => {
  errors++;
  console.log(`  \x1b[31mNG\x1b[0m  ${msg}`);
};
const warn = (msg) => {
  warnings++;
  console.log(`  \x1b[33m??\x1b[0m  ${msg}`);
};
const ok = (msg) => console.log(`  \x1b[32mOK\x1b[0m  ${msg}`);
const head = (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`);

if (!fs.existsSync(DIST)) {
  console.error('dist/ がない。npm run build を先に実行する。');
  process.exit(1);
}

// ── 期待される章の本数（draft を除く） ──
const chapterFiles = fs
  .readdirSync(CONTENT)
  .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'));
const drafts = chapterFiles.filter((f) =>
  /^draft:\s*true$/m.test(fs.readFileSync(path.join(CONTENT, f), 'utf8')),
);
const expectedChapters = chapterFiles.length - drafts.length;
const FIXED_PAGES = 5; // /, /legend, /appendix/{disputed,glossary,sources}

// ── HTML を集める ──
const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'pagefind' || e.name === '_astro') continue;
      walk(p);
    } else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(DIST);

// ───────────────────────────── 1. sitemap.xml
head('1. sitemap.xml');
const sitemapPath = path.join(DIST, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  fail('dist/sitemap.xml が生成されていない');
} else {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);

  if (!xml.startsWith('<?xml')) fail('XML 宣言で始まっていない');
  if (!xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
    fail('urlset の xmlns が sitemaps.org の名前空間になっていない');
  } else ok('xmlns が正しい');

  const expected = expectedChapters + FIXED_PAGES;
  if (locs.length === expected) {
    ok(`URL ${locs.length} 件（章 ${expectedChapters} + 固定 ${FIXED_PAGES}）`);
  } else {
    fail(
      `URL 件数が合わない: ${locs.length} 件（期待 ${expected} = 章 ${expectedChapters} + 固定 ${FIXED_PAGES}）`,
    );
  }

  const relative = locs.filter((l) => !/^https?:\/\//.test(l));
  if (relative.length) fail(`絶対 URL でない loc が ${relative.length} 件: ${relative[0]}`);
  else ok('すべて絶対 URL');

  const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
  if (dupes.length) fail(`loc が重複: ${dupes[0]}`);
  else ok('loc に重複なし');

  const badDate = lastmods.filter((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d));
  if (badDate.length) fail(`lastmod の書式が不正: ${badDate[0]}`);
  else ok(`lastmod ${lastmods.length} 件すべて YYYY-MM-DD`);

  if (locs.some((l) => l.includes('/search'))) fail('/search が sitemap に入っている');
  else ok('/search は入っていない');

  // ベースパス付きビルドで base が付いているか
  const base = process.env.BASE;
  if (base && base !== '/') {
    const seg = base.replace(/\/+$/, '');
    const missing = locs.filter((l) => !new URL(l).pathname.startsWith(`${seg}/`));
    if (missing.length)
      fail(`base(${seg}) が付いていない loc が ${missing.length} 件: ${missing[0]}`);
    else ok(`すべての loc に base(${seg}) が付いている`);
  }
  console.log(`      例: ${locs[0]}`);
  console.log(`      例: ${locs[locs.length - 1]}`);
}

// ───────────────────────────── 2. robots.txt
head('2. robots.txt');
const robotsPath = path.join(DIST, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  fail('dist/robots.txt が生成されていない');
} else {
  const txt = fs.readFileSync(robotsPath, 'utf8');
  const sitemapLine = txt.match(/^Sitemap:\s*(\S+)$/m);
  if (!sitemapLine) fail('Sitemap 行がない');
  else if (!/^https?:\/\//.test(sitemapLine[1]))
    fail(`Sitemap が絶対 URL でない: ${sitemapLine[1]}`);
  else ok(`Sitemap: ${sitemapLine[1]}`);

  if (!/^User-agent:\s*\*$/m.test(txt)) fail('User-agent: * の節がない');
  else ok('User-agent: * がある');

  const wanted = [
    'OAI-SearchBot',
    'Claude-SearchBot',
    'PerplexityBot',
    'GPTBot',
    'ClaudeBot',
    'Google-Extended',
  ];
  const missing = wanted.filter((ua) => !new RegExp(`^User-agent:\\s*${ua}$`, 'm').test(txt));
  if (missing.length) fail(`AI クローラの節がない: ${missing.join(', ')}`);
  else ok(`AI クローラ ${wanted.length} 種を明示`);

  // Disallow: / が事故で入っていないか（全面ブロックは致命的）
  if (/^Disallow:\s*\/\s*$/m.test(txt)) fail('Disallow: / がある（サイト全体がブロックされる）');
  else ok('全面ブロックの Disallow はない');
}

// ───────────────────────────── 3. llms.txt
head('3. llms.txt');
const llmsPath = path.join(DIST, 'llms.txt');
if (!fs.existsSync(llmsPath)) {
  fail('dist/llms.txt が生成されていない');
} else {
  const txt = fs.readFileSync(llmsPath, 'utf8');
  const lines = txt.split('\n');
  if (!/^# \S/.test(lines[0])) fail('1行目が H1 になっていない（llmstxt.org の必須要素）');
  else ok(`H1: ${lines[0]}`);

  if (!txt.includes('\n> ')) warn('引用（> 要約）がない。仕様上は任意だが推奨');
  else ok('引用による要約がある');

  const links = [...txt.matchAll(/^- \[([^\]]+)\]\((https?:\/\/[^)]+)\)/gm)];
  if (links.length < expectedChapters) {
    fail(
      `リンクが ${links.length} 件しかない（章が ${expectedChapters} 本あるので、それ以上あるべき）`,
    );
  } else ok(`リンク ${links.length} 件（章 ${expectedChapters} + 付録など）`);

  const rel = links.filter((m) => !/^https?:\/\//.test(m[2]));
  if (rel.length) fail('相対 URL のリンクがある');
  else ok('すべて絶対 URL');

  const kb = (Buffer.byteLength(txt, 'utf8') / 1024).toFixed(1);
  ok(`サイズ ${kb} KiB`);
}

// ───────────────────────────── 4. JSON-LD
head('4. JSON-LD');
const REQUIRED = {
  WebSite: ['name', 'url'],
  WebPage: ['url', 'name'],
  CollectionPage: ['url', 'name'],
  Book: ['name', 'url'],
  Article: ['headline', 'author', 'inLanguage'],
  BreadcrumbList: ['itemListElement'],
  DefinedTermSet: ['name', 'hasDefinedTerm'],
  Organization: ['name'],
  Person: ['name'],
};

let ldPages = 0;
let ldNodes = 0;
let biggest = { file: '', bytes: 0 };

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ];
  if (!blocks.length) continue;
  ldPages++;

  for (const b of blocks) {
    const raw = b[1].replace(/\\u003c/g, '<');
    const bytes = Buffer.byteLength(raw, 'utf8');
    if (bytes > biggest.bytes) biggest = { file, bytes };

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      fail(`${file}: JSON.parse に失敗 — ${e.message}`);
      continue;
    }

    if (data['@context'] !== 'https://schema.org') {
      fail(`${file}: @context が https://schema.org でない`);
    }
    const graph = data['@graph'];
    if (!Array.isArray(graph)) {
      fail(`${file}: @graph が配列でない`);
      continue;
    }

    // @id の解決確認: 参照されている @id が、同じページ内か絶対 URL で定義されているか
    const defined = new Set(graph.map((n) => n['@id']).filter(Boolean));
    const refs = [];
    const collectRefs = (v) => {
      if (Array.isArray(v)) return v.forEach(collectRefs);
      if (v && typeof v === 'object') {
        const keys = Object.keys(v);
        if (keys.length === 1 && keys[0] === '@id') refs.push(v['@id']);
        else Object.values(v).forEach(collectRefs);
      }
    };
    graph.forEach((n) => {
      for (const [k, v] of Object.entries(n)) {
        if (k === '@id') continue;
        collectRefs(v);
      }
    });
    for (const r of new Set(refs)) {
      if (!defined.has(r)) fail(`${file}: @id 参照 ${r} が同じページで定義されていない`);
    }

    for (const node of graph) {
      ldNodes++;
      const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
      if (!node['@type']) fail(`${file}: @type のない節点がある`);
      if (!node['@id']) warn(`${file}: @id のない節点がある (${types.join(',')})`);

      for (const t of types) {
        const req = REQUIRED[t];
        if (!req) continue;
        for (const prop of req) {
          if (node[prop] === undefined || node[prop] === null || node[prop] === '') {
            fail(`${file}: ${t} に ${prop} がない`);
          }
        }
      }

      // 型ごとの追加検証
      if (types.includes('BreadcrumbList')) {
        const items = node.itemListElement ?? [];
        items.forEach((it, i) => {
          if (it.position !== i + 1) fail(`${file}: BreadcrumbList の position が連番でない`);
          if (!it.name) fail(`${file}: ListItem に name がない`);
          if (i < items.length - 1 && !it.item) {
            fail(`${file}: 最後以外の ListItem に item がない（Google は最終要素のみ省略可）`);
          }
        });
      }
      if (node.citation) {
        if (!Array.isArray(node.citation)) fail(`${file}: citation が配列でない`);
        else {
          const bad = node.citation.filter((c) => c['@type'] !== 'CreativeWork' || !c.name);
          if (bad.length) fail(`${file}: citation に @type/name が欠けた要素が ${bad.length} 件`);
          const withUrl = node.citation.filter((c) => c.url).length;
          ok(
            `${path.relative(DIST, file)}: citation ${node.citation.length} 件（うち URL 付き ${withUrl}）`,
          );
        }
      }
      if (node.hasPart) {
        if (!Array.isArray(node.hasPart)) fail(`${file}: hasPart が配列でない`);
        else {
          const positions = node.hasPart.map((p) => p.position);
          if (new Set(positions).size !== positions.length)
            fail(`${file}: hasPart の position が重複`);
          if (node.hasPart.length !== expectedChapters) {
            fail(
              `${file}: Book.hasPart が ${node.hasPart.length} 件（章は ${expectedChapters} 本）`,
            );
          } else ok(`${path.relative(DIST, file)}: Book.hasPart ${node.hasPart.length} 章`);
        }
      }
      if (node.hasDefinedTerm) {
        ok(`${path.relative(DIST, file)}: DefinedTerm ${node.hasDefinedTerm.length} 件`);
      }
      for (const k of ['datePublished', 'dateModified']) {
        if (node[k] && !/^\d{4}-\d{2}-\d{2}/.test(node[k])) {
          fail(`${file}: ${k} の書式が不正: ${node[k]}`);
        }
      }
      if (node.url && !/^https?:\/\//.test(node.url))
        fail(`${file}: url が絶対 URL でない: ${node.url}`);
    }
  }
}

if (ldPages === 0) {
  fail(
    'JSON-LD を持つページが1つもない。' +
      'Seo.astro を BaseLayout.astro の <head> に組み込むと解消する（報告のパッチを参照）',
  );
} else {
  ok(`JSON-LD を持つページ ${ldPages} 枚 / 節点 ${ldNodes} 個 — すべて JSON として妥当`);
  ok(
    `最大の JSON-LD: ${path.relative(DIST, biggest.file)} = ${(biggest.bytes / 1024).toFixed(1)} KiB`,
  );
}

// ───────────────────────────── 5. head の重複と欠落
head('5. head（canonical / description / title）');
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(DIST, file);
  // Seo.astro を通していないページは対象外（BaseLayout に組み込むまでは通常ページが該当）
  if (!html.includes('application/ld+json')) continue;

  const canon = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  if (canon.length !== 1) fail(`${rel}: canonical が ${canon.length} 個`);
  else if (!/^https?:\/\//.test(canon[0])) fail(`${rel}: canonical が絶対 URL でない`);

  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/g)].map((m) => m[1]);
  if (titles.length !== 1) fail(`${rel}: <title> が ${titles.length} 個`);
  else {
    if (titles[0].length > 60)
      warn(`${rel}: title が ${titles[0].length} 字（60 字超）: ${titles[0]}`);
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(titles[0])) fail(`${rel}: title に絵文字`);
  }

  const descs = [...html.matchAll(/<meta name="description" content="([^"]*)"/g)].map((m) => m[1]);
  if (descs.length !== 1) fail(`${rel}: description が ${descs.length} 個`);
  else {
    const n = descs[0].length;
    if (n > 160) fail(`${rel}: description が ${n} 字（上限 160）`);
    else if (n < 50) warn(`${rel}: description が ${n} 字で短い`);
    if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(descs[0]))
      fail(`${rel}: description に絵文字`);
  }

  const robotsMeta = [...html.matchAll(/<meta name="robots" content="([^"]*)"/g)].map((m) => m[1]);
  if (robotsMeta.length > 1)
    fail(`${rel}: robots meta が ${robotsMeta.length} 個（BaseLayout の分が残っている）`);
  for (const r of robotsMeta) {
    if (/noindex/.test(r) && !/seo-preview/.test(rel)) warn(`${rel}: noindex が付いている（${r}）`);
  }

  for (const p of [
    'og:title',
    'og:description',
    'og:url',
    'og:site_name',
    'og:locale',
    'og:type',
  ]) {
    if (!html.includes(`property="${p}"`)) fail(`${rel}: ${p} がない`);
  }
  if (!html.includes('name="twitter:card"')) fail(`${rel}: twitter:card がない`);
}
ok(
  `head を検査したページ: ${htmlFiles.filter((f) => fs.readFileSync(f, 'utf8').includes('application/ld+json')).length} 枚`,
);

// ───────────────────────────── 結果
console.log(
  `\n\x1b[1m結果\x1b[0m  NG ${errors} 件 / ?? ${warnings} 件 / HTML ${htmlFiles.length} 枚`,
);
process.exit(errors > 0 ? 1 : 0);
