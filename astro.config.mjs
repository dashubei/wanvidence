// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import rehypeChapterLinks from './src/lib/rehype-chapter-links.mjs';

// 配信先は環境変数で受け取る。未設定ならローカル閲覧用の値に落ちる。
//
// なぜハードコードしないか:
//   リポジトリ名がまだ確定していない。プロジェクトサイト（/<repo>/ 配下）と
//   ユーザーサイト（base なし）のどちらでも、設定を書き換えずに配信したい。
//   GitHub Actions 側では actions/configure-pages の出力
//   （origin と base_path）をそのまま SITE / BASE に渡している。
//
// BASE は、ユーザーサイトのとき configure-pages が空文字を返す。
// `||` で '/' に落ちるので、そのまま渡してよい。
const site = process.env.SITE || 'http://localhost:4321';
const base = process.env.BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    // CSS を HTML に埋め込む。外部ファイルにすると、それがレンダリングブロックになる。
    //
    // 実測（Lighthouse・モバイル・4倍 CPU・brotli 配信、各3回）:
    //   外部 CSS   Perf 98/98/97   FCP 平均 1,979ms   render-blocking 監査 0.5（失点）
    //   インライン Perf 99/98/99   FCP 平均 1,706ms   render-blocking 監査 1.0（合格）
    //
    // 代償は、ページ間で CSS がキャッシュされなくなること。
    // brotli 後で トップ +4.0KB / 章 +6.4KB を毎ページ余分に運ぶ。
    // 検索から1ページだけ深く読む人（リファレンスなのでこちらが多い）には
    // 273ms の得。章から章へ読み進む人には損。前者を取った。
    inlineStylesheets: 'always',
  },
  integrations: [mdx(), pagefind()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    // Markdown / MDX の処理系を明示する。
    //
    // Astro 7 で既定の処理系が satteri（@astrojs/markdown-satteri）に変わった。
    // remark / rehype のプラグインと
    // remarkRehype は unified 側の設定なので、processor: unified({...}) の中に置く。
    // 以前は markdown 直下に remarkRehype / rehypePlugins を書いていて、
    // Astro が暗黙に unified() へ移し替えてくれていた（非推奨警告が出ていた経路）。
    // ここを省くと satteri が使われ、下の2つは黙って無視される
    // （astro の schemas/base.js が `.default(() => satteri())` を持っている）。
    //
    // MDX も同じ処理系を継承する（@astrojs/mdx が processor.options を読む）ので、
    // mdx() 側に同じ設定を重ねて書く必要はない。
    processor: unified({
      // remark-gfm の脚注は、既定で英語の "Footnotes" と "Back to reference N" を出す。
      // どちらも画面には出ないが読み上げには乗るので、本文と同じ日本語にする。
      // （脚注は1章あたり最大154個ある。全部が英語で読まれると使えない）
      remarkRehype: {
        footnoteLabel: '出典',
        footnoteBackLabel: (/** @type {number} */ referenceIndex) =>
          `本文の注 ${referenceIndex + 1} に戻る`,
      },
      // rehype プラグインは Node 側で動くので import.meta.env.BASE_URL が使えない。
      // base は引数で渡す。
      rehypePlugins: [[rehypeChapterLinks, { base }]],
    }),
    // shikiConfig は processor の中ではなく markdown 直下のまま。
    // 構文ハイライトは処理系をまたぐ共通設定（AstroMarkdownOptions）で、
    // unified() の受け取るオプション（UnifiedProcessorOptions）には入っていない。
    // 非推奨警告の対象でもない。
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
