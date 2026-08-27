// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import tailwindcss from '@tailwindcss/vite';
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
  build: { format: 'directory' },
  integrations: [mdx(), pagefind()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
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
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
