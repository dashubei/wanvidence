#!/usr/bin/env node
/**
 * アクセシビリティの健康診断。`node scripts/a11y-audit.mjs` で実行する。
 *
 * ビルド結果（dist/）の HTML を読んで、機械的に判定できるものだけを見る。
 * ブラウザを使わないので CI でもそのまま動く。
 *
 * 見るもの:
 *   1. 見出し階層（h1 が1つか / h2 → h4 のような飛びがないか）
 *   2. ランドマーク（header / main / footer / nav と、nav の区別）
 *   3. lang 属性と viewport の拡大禁止
 *   4. スキップリンクと、その飛び先が実在するか
 *   5. 表の見出しセル（th / scope）
 *   6. 文脈に依存するリンクテキスト（「こちら」など）
 *   7. id の重複（アンカーが壊れる）
 *   8. アクセシブルな名前が消えるパターン
 *      （aria-label と中身のテキストが両方あるボタン。aria-label が中身を上書きする）
 *   9. tabindex の正の値（Tab 順が壊れる）
 *  10. 空のリンク / 空のボタン
 *
 * 本文は MDX なので、見出しの飛びは実際に起きる。手で29章を見るのは無理なのでコマンドにした。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

if (!fs.existsSync(DIST)) {
  console.error(`\n  ${DIST}/ がない。先に \`npm run build\` を実行すること。\n`);
  process.exit(1);
}

/** dist 以下の index.html を全部集める */
function pages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Pagefind の生成物は検査対象外（自前で書いた HTML ではない）
      if (e.name === 'pagefind' || e.name === '_astro') continue;
      pages(p, out);
    } else if (e.name.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

/** <script> と <style> の中身を落とす。属性の見た目を持つ文字列に引っかからないため */
function stripInert(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

/** 開始タグの属性を雑に読む。値なし属性は空文字にする */
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g,
  )) {
    // タグ名そのものを拾ってしまう最初の一致は捨てる
    if (m.index === 0) continue;
    const raw = m[2];
    out[m[1].toLowerCase()] = raw == null ? '' : raw.replace(/^["']|["']$/g, '');
  }
  return out;
}

/** タグを落として可視テキストにする */
const textOf = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .trim();

/** 文脈に依存するリンクテキスト。単体だと行き先が分からないもの */
const VAGUE = new Set([
  'こちら',
  'ここ',
  'こちらから',
  'こちらをクリック',
  'クリック',
  '詳しくは',
  '詳細',
  '詳細はこちら',
  'リンク',
  '続きを読む',
  'もっと見る',
  'こちらの記事',
  '参照',
  '以下',
  '上記',
  'here',
  'click here',
  'link',
  'read more',
  'more',
  'this',
  'this page',
]);

const findings = [];
const add = (file, level, rule, msg) => findings.push({ file, level, rule, msg });

const files = pages(DIST).sort();
const summary = [];

for (const file of files) {
  const rel = file.replace(/^dist\//, '/').replace(/\/index\.html$/, '/') || '/';
  const raw = fs.readFileSync(file, 'utf8');
  const html = stripInert(raw);

  // --- 1. 見出し階層 ---
  const heads = [...html.matchAll(/<(h[1-6])\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map((m) => ({
    level: Number(m[1][1]),
    text: textOf(m[3]).slice(0, 40),
    attr: attrs('h ' + m[2]),
  }));
  const h1s = heads.filter((h) => h.level === 1);
  if (h1s.length === 0) add(rel, 'ERROR', 'heading', 'h1 がない');
  if (h1s.length > 1)
    add(
      rel,
      'ERROR',
      'heading',
      `h1 が ${h1s.length} 個ある: ` + h1s.map((h) => `「${h.text}」`).join(' '),
    );

  let prev = 0;
  for (const h of heads) {
    if (prev && h.level > prev + 1) {
      add(rel, 'ERROR', 'heading', `h${prev} → h${h.level} と飛んでいる（「${h.text}」）`);
    }
    prev = h.level;
  }
  for (const h of heads) {
    if (!h.text) add(rel, 'ERROR', 'heading', `中身が空の h${h.level} がある`);
  }

  // h1 より前に見出しがあると、見出し送りで読む人は本文の題名にたどり着く前に
  // 別の見出し群を通過することになる。サイドバーの見出しが本文の見出し階層に
  // 混ざるのも同じ原因で起きる。
  const firstH1 = heads.findIndex((h) => h.level === 1);
  if (firstH1 > 0) {
    const before = heads.slice(0, firstH1);
    add(
      rel,
      'ERROR',
      'heading',
      `h1 より前に見出しが ${before.length} 個ある（h${before[0].level}「${before[0].text}」など）` +
        '。本文以外の見出しは <p> にするか aria で分ける',
    );
  }

  // lang="ja" のページに英語だけの見出しが混ざると、日本語の読み上げ音声で読まれる。
  // remark-gfm の脚注ラベル（既定値 "Footnotes"）がそのまま残るとここに出る。
  //
  // 書き手が lang を宣言している見出しは対象外。宣言があれば読み上げ音声は
  // その言語に切り替わるので、これは問題ではなく対処済みの状態である。
  // （サイト名 Wanvidence は lang="en" を付けている造語）
  for (const h of heads) {
    if (h.attr.lang) continue;
    if (h.text && /^[\x20-\x7e]+$/.test(h.text) && /[A-Za-z]{3,}/.test(h.text)) {
      add(rel, 'WARN', 'lang', `英語だけの見出し「${h.text}」がある（訳すか lang="en" を付ける）`);
    }
  }

  // --- 2. ランドマーク ---
  for (const tag of ['header', 'main', 'footer']) {
    const n = [...html.matchAll(new RegExp(`<${tag}\\b`, 'gi'))].length;
    if (n === 0) add(rel, 'WARN', 'landmark', `<${tag}> がない`);
  }
  const mains = [...html.matchAll(/<main\b/gi)].length;
  if (mains > 1) add(rel, 'ERROR', 'landmark', `<main> が ${mains} 個ある（1つにする）`);

  // nav が複数あるなら、それぞれ区別できる名前が必要
  const navs = [...html.matchAll(/<nav\b([^>]*)>/gi)].map((m) => attrs('nav ' + m[1]));
  if (navs.length > 1) {
    const names = navs.map((a) => a['aria-label'] || a['aria-labelledby'] || '');
    const unnamed = names.filter((n) => !n).length;
    if (unnamed)
      add(
        rel,
        'ERROR',
        'landmark',
        `<nav> が ${navs.length} 個あるのに ${unnamed} 個に aria-label がない`,
      );
    const dup = names.filter((n) => n && names.indexOf(n) !== names.lastIndexOf(n));
    if (dup.length)
      add(rel, 'ERROR', 'landmark', `<nav> の aria-label が重複: ${[...new Set(dup)].join(' / ')}`);
  }

  // --- 3. lang と viewport ---
  const htmlTag = /<html\b([^>]*)>/i.exec(raw);
  const lang = htmlTag ? attrs('html ' + htmlTag[1]).lang : undefined;
  if (!lang) add(rel, 'ERROR', 'lang', '<html> に lang がない');
  else if (!/^ja\b/.test(lang)) add(rel, 'WARN', 'lang', `<html lang="${lang}"> が ja でない`);

  const vp = /<meta[^>]+name=["']viewport["'][^>]*>/i.exec(raw);
  if (!vp) add(rel, 'ERROR', 'viewport', 'viewport の meta がない');
  else {
    const c = attrs('meta ' + vp[0].replace(/^<meta/i, '').replace(/>$/, ''))['content'] || '';
    if (/user-scalable\s*=\s*no/i.test(c))
      add(rel, 'ERROR', 'viewport', '拡大が禁止されている（user-scalable=no）');
    const max = /maximum-scale\s*=\s*([\d.]+)/i.exec(c);
    if (max && Number(max[1]) < 2)
      add(rel, 'ERROR', 'viewport', `maximum-scale=${max[1]} は 2 未満（拡大が制限される）`);
  }

  // --- 4. スキップリンク ---
  const skip =
    /<a\b[^>]*href=["']#([^"']+)["'][^>]*class=["'][^"']*skip-link|<a\b[^>]*class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#([^"']+)["']/i.exec(
      html,
    );
  if (!skip) {
    add(rel, 'WARN', 'skiplink', '本文へ飛ぶスキップリンクがない');
  } else {
    const id = skip[1] || skip[2];
    if (id && !new RegExp(`id=["']${id}["']`).test(html)) {
      add(rel, 'ERROR', 'skiplink', `スキップリンクの飛び先 #${id} が存在しない`);
    }
  }

  // --- 5. 表 ---
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  let noTh = 0;
  let noScope = 0;
  for (const t of tables) {
    const inner = t[1];
    const ths = [...inner.matchAll(/<th\b([^>]*)>/gi)];
    if (ths.length === 0) {
      noTh++;
      continue;
    }
    // 行方向・列方向が混ざる表では scope が必要になる。
    // 単純な1行ヘッダだけの表は scope なしでも解釈が一意なので数えるだけにする。
    const hasRowHeader = /<tbody[\s\S]*?<tr[^>]*>\s*<th\b/i.test(inner);
    if (hasRowHeader && ths.some((m) => !/scope=/i.test(m[1]))) noScope++;
  }
  if (noTh)
    add(
      rel,
      'ERROR',
      'table',
      `th のない表が ${noTh} 個（見出しセルがないと読み上げで列が分からない）`,
    );
  if (noScope)
    add(rel, 'WARN', 'table', `行見出しと列見出しが混在するのに scope のない表が ${noScope} 個`);

  // --- 6. リンクテキスト ---
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const vague = new Map();
  let emptyLinks = 0;
  for (const m of links) {
    const a = attrs('a ' + m[1]);
    const label = (a['aria-label'] || '').trim();
    const inner = m[2];
    // aria-hidden な中身は読み上げられない
    const visible = textOf(inner);
    const name = label || visible;
    if (!name) {
      // 画像だけのリンクは alt があれば名前になる
      const alt = /alt=["']([^"']*)["']/i.exec(inner);
      if (!alt || !alt[1].trim()) emptyLinks++;
      continue;
    }
    const norm = name.replace(/[\s。、．，]/g, '').toLowerCase();
    if (VAGUE.has(norm)) vague.set(norm, (vague.get(norm) || 0) + 1);
  }
  if (emptyLinks)
    add(rel, 'ERROR', 'linkname', `アクセシブルな名前がないリンクが ${emptyLinks} 個`);
  for (const [k, v] of vague) {
    add(
      rel,
      'WARN',
      'linktext',
      `文脈依存のリンクテキスト「${k}」が ${v} 個（行き先が分かる語にする）`,
    );
  }

  // --- 7. id の重複 ---
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
  const seen = new Set();
  const dupIds = new Set();
  for (const id of ids) {
    if (seen.has(id)) dupIds.add(id);
    seen.add(id);
  }
  if (dupIds.size) {
    add(
      rel,
      'ERROR',
      'dupid',
      `id が重複: ${[...dupIds].slice(0, 5).join(' / ')}${dupIds.size > 5 ? ` 他${dupIds.size - 5}件` : ''}`,
    );
  }

  // --- 8. aria-label が中身のテキストを打ち消しているボタン ---
  // aria-label はアクセシブルな名前を上書きする。中身に状態を示すテキストがあっても読まれない。
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const a = attrs('button ' + m[1]);
    if (!a['aria-label']) continue;
    // aria-hidden ではない可視テキストが中にあるか
    const inner = m[2].replace(/<[^>]*aria-hidden=["']true["'][^>]*>[\s\S]*?<\/[a-z]+>/gi, '');
    const t = textOf(inner);
    if (t && t !== a['aria-label']) {
      add(
        rel,
        'WARN',
        'ariaoverride',
        `<button aria-label="${a['aria-label']}"> の中に別のテキスト「${t.slice(0, 40)}」がある（aria-label が上書きするので読まれない）`,
      );
    }
  }

  // --- 9. tabindex の正の値 ---
  const posTab = [...html.matchAll(/tabindex=["']([1-9]\d*)["']/g)];
  if (posTab.length)
    add(
      rel,
      'ERROR',
      'tabindex',
      `tabindex に正の値が ${posTab.length} 個（Tab 順が DOM 順から外れる）`,
    );

  // --- 10. 空のボタン ---
  let emptyBtn = 0;
  for (const m of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const a = attrs('button ' + m[1]);
    if (a['aria-label'] || a['aria-labelledby'] || a['title']) continue;
    if (!textOf(m[2])) emptyBtn++;
  }
  if (emptyBtn) add(rel, 'ERROR', 'btnname', `アクセシブルな名前がないボタンが ${emptyBtn} 個`);

  summary.push({ rel, heads: heads.length, tables: tables.length, links: links.length });
}

// --- 出力 ---
const pad = (s, n) => String(s).padEnd(n, ' ');
const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');

console.log(`\nアクセシビリティ検査  （${files.length} ページ）\n`);

if (findings.length === 0) {
  console.log('  問題なし\n');
} else {
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, list] of byFile) {
    console.log(`  ${file}`);
    for (const f of list) {
      console.log(`    ${f.level === 'ERROR' ? '×' : '△'} [${pad(f.rule, 12)}] ${f.msg}`);
    }
  }
  console.log();
}

// ルール別の件数（どこから直すかを決めるため）
if (findings.length) {
  const byRule = new Map();
  for (const f of findings) {
    const k = `${f.level} ${f.rule}`;
    byRule.set(k, (byRule.get(k) || 0) + 1);
  }
  console.log('  ルール別\n');
  for (const [k, v] of [...byRule].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${pad(k, 24)} ${String(v).padStart(4)} 件`);
  }
  console.log();
}

console.log(`  × ${errors.length} 件 / △ ${warns.length} 件\n`);
process.exit(errors.length > 0 ? 1 : 0);
