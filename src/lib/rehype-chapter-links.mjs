import fs from 'node:fs';
import path from 'node:path';
import { visit, SKIP } from 'unist-util-visit';

/**
 * 本文中の「第N章」を、その章へのリンクに変換する rehype プラグイン。
 * あわせて、本文が書いたサイト内リンクにベースパスを付ける。
 *
 * なぜ必要か:
 *   章をまたぐ参照（「詳しくは第7章で扱う」）が本文に49箇所ある。
 *   これが素のテキストのままだと、読者は目次に戻って探さなければならない。
 *
 * 設計:
 *   - 章番号 → ファイル名の対応は、`src/content/chapters/NN-slug.mdx` の
 *     ファイル名から作る。frontmatter を読まずに済むので速い。
 *   - **まだ存在しない章はリンクにしない。** 執筆途中の本なので、
 *     リンク切れを作らないことを優先する。存在しない章番号は素のテキストのまま残る。
 *   - `<a>` の中と `<code>` の中は対象外（二重リンクとコード例の破壊を防ぐ）。
 *   - base は astro.config.mjs から引数で受け取る。このプラグインは Node 側で動くので
 *     `import.meta.env.BASE_URL`（src/lib/url.ts が使っているもの）が読めない。
 */

// 「第2部第4章」のような外部文献の章番号は対象外にする。
// （アニコム白書など、他の書籍の章を指している箇所が実際にある）
const CHAPTER_RE = /(?<!第\d{1,2}部)第(\d{1,2})章/g;

function loadChapterMap() {
  const dir = path.resolve('src/content/chapters');
  const map = new Map();
  if (!fs.existsSync(dir)) return map;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.mdx') || file.startsWith('_')) continue;
    const m = /^(\d+)-(.+)\.mdx$/.exec(file);
    if (!m) continue;
    map.set(Number(m[1]), file.slice(0, -'.mdx'.length));
  }
  return map;
}

export default function rehypeChapterLinks(options = {}) {
  // 末尾スラッシュを落として持つ（base なしなら空文字）。src/lib/url.ts と同じ扱い。
  const base = (options.base ?? '/').replace(/\/+$/, '');
  const href = (p) => `${base}/${p.replace(/^\/+/, '')}`;

  return (tree) => {
    // --- 本文が Markdown で書いたサイト内リンクに base を付ける ---
    // 例: `[第8章](/chapters/08-breed-principles)` が9章にある。
    // 本文側で base を意識させたくないので、ここでまとめて書き換える。
    // `//example.com` のようなプロトコル相対の外部リンクは対象外。
    if (base) {
      visit(tree, 'element', (node) => {
        if (node.tagName !== 'a') return;
        const v = node.properties?.href;
        if (typeof v !== 'string') return;
        if (!v.startsWith('/') || v.startsWith('//')) return;
        if (v === base || v.startsWith(`${base}/`)) return; // 二重付与を防ぐ
        node.properties.href = href(v);
      });
    }

    // --- 「第N章」をリンクにする ---
    const map = loadChapterMap();
    if (map.size === 0) return;

    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (parent.type === 'element' && (parent.tagName === 'a' || parent.tagName === 'code')) {
        return SKIP;
      }

      const value = node.value;
      if (!value.includes('章')) return;

      CHAPTER_RE.lastIndex = 0;
      const out = [];
      let last = 0;
      let match;

      while ((match = CHAPTER_RE.exec(value)) !== null) {
        const slug = map.get(Number(match[1]));
        if (!slug) continue; // まだ書かれていない章はリンクにしない

        if (match.index > last) {
          out.push({ type: 'text', value: value.slice(last, match.index) });
        }
        out.push({
          type: 'element',
          tagName: 'a',
          properties: { href: href(`chapters/${slug}`), className: ['xref'] },
          children: [{ type: 'text', value: match[0] }],
        });
        last = match.index + match[0].length;
      }

      if (out.length === 0) return;
      if (last < value.length) out.push({ type: 'text', value: value.slice(last) });

      parent.children.splice(index, 1, ...out);
      return [SKIP, index + out.length];
    });
  };
}
