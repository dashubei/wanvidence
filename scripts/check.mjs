#!/usr/bin/env node
/**
 * 原稿の健康診断。`npm run check` で実行する。
 *
 * 見るもの:
 *   1. 読みやすさ（一文の長さ・漢字率・分量）
 *   2. MDX の落とし穴（items 内のコンポーネント / Markdown 記法）
 *   3. 脚注の参照と定義の対応
 *   4. 章参照のズレ（「第N章（ラベル）」が実際の章と合っているか）
 *
 * これらは全部、実際に事故が起きた項目である。
 * 手で確認していると見落とすので、コマンドにした。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/chapters';
const files = fs
  .readdirSync(DIR)
  .filter((f) => /^\d/.test(f) && f.endsWith('.mdx'))
  .sort();

const GOAL = { sentence: 50, kanji: 30 };

/**
 * frontmatter・出典・タグを除いた地の文。
 *
 * 注意: 箇条書きや items の各項目は、末尾に句点がないことがある。
 * そのまま連結すると「1つの長い文」として数えてしまい、一文平均が実態より
 * 大きく出る（11章の執筆者がこの誤差を指摘した）。
 * そこで、行の区切りと items の要素区切りを、文の区切りとして扱う。
 */
function plainText(src) {
  return src
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^\[\^[^\]]+\]:.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, '');
}

/** 文に分割する。句読点だけでなく、行の区切りも文の切れ目とみなす */
function splitSentences(text) {
  return text
    .split(/[。？！\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function measure(src) {
  const t = plainText(src);
  const flat = t.replace(/\n/g, '');
  const kanji = (flat.match(/[一-鿿]/g) ?? []).length;
  const sentences = splitSentences(t);
  const avg = sentences.length ? sentences.reduce((a, s) => a + s.length, 0) / sentences.length : 0;
  return { chars: flat.length, kanjiRate: flat.length ? (kanji / flat.length) * 100 : 0, avg };
}

// --- 章番号 → タイトル ---
const titles = new Map();
for (const f of files) {
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const order = /^order:\s*(\d+)/m.exec(s);
  const title = /^title:\s*"([^"]+)"/m.exec(s);
  if (order && title) titles.set(Number(order[1]), title[1]);
}

let problems = 0;
const rows = [];

for (const f of files) {
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  const name = f.replace(/\.mdx$/, '');
  const m = measure(src);

  // items 内の異物（ビルドは通るが機能が失われる）
  const bad = [];
  for (const block of src.matchAll(/items=\{\[(.*?)\]\}/gs)) {
    for (const c of block[1].matchAll(/<([A-Z][A-Za-z]*)/g)) bad.push(`<${c[1]}>`);
    for (const c of block[1].matchAll(/\[\^[^\]]+\]/g)) bad.push(c[0]);
  }

  // 脚注: 参照はあるが定義がない
  const defs = new Set([...src.matchAll(/^\[\^([^\]]+)\]:/gm)].map((x) => x[1]));
  const body = src.replace(/^\[\^[^\]]+\]:.*$/gm, '');
  const undef = [...new Set([...body.matchAll(/\[\^([^\]]+)\]/g)].map((x) => x[1]))].filter(
    (k) => !defs.has(k),
  );

  // 章参照のズレ
  const xref = [];
  // 「第N章「ラベル」」「第N章（ラベル）」の形を拾う。
  // 開き括弧・閉じ括弧はコードポイントで指定する（文字クラス内の括弧は読みにくいため）
  const OPEN = '[\\u300c\\u300e(\\uff08]'; // 「 『 ( （
  const CLOSE = '[\\u300d\\u300f)\\uff09]'; // 」 』 ) ）
  const XREF = new RegExp(
    `第(\\d{1,2})章\\s*${OPEN}([^\\u300d\\u300f)\\uff09]{2,30})${CLOSE}`,
    'g',
  );
  for (const r of src.matchAll(XREF)) {
    const n = Number(r[1]);
    const label = r[2];
    const actual = titles.get(n);
    if (!actual) continue; // 未執筆章への参照はリンク化されない

    // 誤検出を除く:
    //   1. 外部文献の章番号（アニコム白書など）。直前に「第N部」や書名がある
    //   2. 内容の説明を括弧に入れただけのもの（「・」で列挙されている）
    const before = src.slice(Math.max(0, r.index - 30), r.index);
    if (/第\d{1,2}部\s*$/.test(before) || /白書|report|Report/.test(before)) continue;
    if (label.includes('・')) continue;

    // ラベルの3文字以上が実タイトルに含まれるか。
    // 略称（「住居」→「住む場所」）も拾えるよう、2文字一致も許容する
    const hit = [...Array(Math.max(1, label.length - 1))].some((_, i) => {
      const frag = label.slice(i, i + 2);
      return frag.length >= 2 && actual.includes(frag);
    });
    if (!hit) xref.push(`第${n}章（${label}）→ 実際「${actual}」`);
  }

  if (bad.length || undef.length || xref.length) problems++;
  rows.push({ name, ...m, bad, undef, xref });
}

// --- 出力 ---
const pad = (s, n) => String(s).padEnd(n, ' ');
const num = (s, n) => String(s).padStart(n, ' ');

console.log('\n読みやすさ  （目標: 一文 50字以下 / 漢字率 30%以下）\n');
console.log(`  ${pad('章', 26)} ${num('字数', 7)} ${num('漢字率', 7)} ${num('一文', 7)}`);
for (const r of rows) {
  const flagS = r.avg > GOAL.sentence ? '!' : ' ';
  const flagK = r.kanjiRate > GOAL.kanji ? '!' : ' ';
  console.log(
    `  ${pad(r.name, 26)} ${num(r.chars.toLocaleString('ja-JP'), 7)} ` +
      `${num(r.kanjiRate.toFixed(1) + '%', 6)}${flagK} ${num(r.avg.toFixed(1) + '字', 6)}${flagS}`,
  );
}

const okS = rows.filter((r) => r.avg <= GOAL.sentence).length;
const okK = rows.filter((r) => r.kanjiRate <= GOAL.kanji).length;
console.log(`\n  一文が目標以下: ${okS} / ${rows.length} 章`);
console.log(`  漢字率が目標以下: ${okK} / ${rows.length} 章`);

console.log('\n不具合の検査\n');
if (problems === 0) {
  console.log('  問題なし（items の異物・未定義の脚注・章参照のズレ、いずれもなし）');
} else {
  console.log('  ※ 章参照は、ラベルが章タイトルそのものでなく「内容の説明」の場合も');
  console.log('    検出される。章番号が合っていれば問題ない。\n');
  for (const r of rows) {
    if (!r.bad.length && !r.undef.length && !r.xref.length) continue;
    console.log(`  ${r.name}`);
    if (r.bad.length) console.log(`    items 内の異物: ${r.bad.join(' ')}`);
    if (r.undef.length) console.log(`    未定義の脚注: ${r.undef.join(' ')}`);
    for (const x of r.xref) console.log(`    章参照のズレ: ${x}`);
  }
}
console.log();
process.exit(problems > 0 ? 1 : 0);
