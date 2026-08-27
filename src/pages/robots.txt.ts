/**
 * robots.txt をエンドポイントで作る（public/robots.txt にしない理由）。
 *
 *   Sitemap: 行は絶対 URL でなければならない。配信先は環境変数で変わるので、
 *   静的ファイルではオリジンを書けない。だからここで組み立てる。
 *
 * 重要な制約（報告にも書いた）:
 *   robots.txt はオリジンの直下 `/robots.txt` にあるものだけが読まれる。
 *   GitHub Pages のプロジェクトサイト（`https://<user>.github.io/<repo>/`）に配信すると
 *   このファイルは `/<repo>/robots.txt` に出るので、クローラは読まない。
 *   ユーザーサイトか独自ドメインで配信する場合にだけ有効になる。
 *
 * 方針:
 *   AI 検索クローラを歓迎する（依頼者の指示）。
 *   「学習用のクロール」と「検索・回答生成のためのクロール」は
 *   別の User-agent に分かれているので、区別してコメントを付けた。
 *   なお `User-agent: *` に `Allow: /` があるので、個別の Allow は
 *   機能上は不要。意図を明示的に残すために書いている。
 */
import type { APIRoute } from 'astro';
import { SITE_NAME, absoluteUrl } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const sitemap = absoluteUrl('/sitemap.xml', site);
  const llms = absoluteUrl('/llms.txt', site);
  // Disallow のパスはオリジンからの絶対パスで書く必要がある。base 付きで配信するなら
  // `/pagefind/` ではなく `/<repo>/pagefind/` を書かないと当たらない
  const pagefindPath = new URL(absoluteUrl('/pagefind/', site)).pathname;

  const body = `# ${SITE_NAME} — robots.txt
#
# この本は全文を無料で公開している。人間にも、検索エンジンにも、
# AI 検索にも読ませる前提で書かれている。
#
# /search（検索フォーム）を索引から外したいが、ここでは Disallow にしていない。
# robots.txt で拒否するとページ自体が読まれず、head の noindex も読まれないため、
# URL だけが索引に残ることがある。索引から外すのは noindex の仕事なので、
# それは HTML 側で指定している。
#
# /pagefind/ は全文検索の索引データ（JSON と binary の断片が数百ファイル）。
# 本文ではないし索引に入れても意味がないので、ここだけ読ませない。

User-agent: *
Allow: /
Disallow: ${pagefindPath}

# ---------------------------------------------------------------
# AI 検索・回答生成のためのクローラ（歓迎する）
#
# これらは「ユーザーの質問に答えるとき、出典としてこのサイトを引く」ために
# クロールする。ここを閉じると、AI の回答から引用・リンクされなくなる。
# ---------------------------------------------------------------

# OpenAI（ChatGPT の検索機能に載せるためのクローラ）
User-agent: OAI-SearchBot
Allow: /

# Anthropic（Claude の検索結果の品質向上のためのクローラ）
User-agent: Claude-SearchBot
Allow: /

# Perplexity（検索結果に出してリンクするためのクローラ。学習には使わないと明記されている）
User-agent: PerplexityBot
Allow: /

# Microsoft Bing（Bing の索引は Copilot の回答生成にも使われる）
User-agent: bingbot
Allow: /

# Google（AI Overviews / AI Mode は通常の Googlebot の索引を使う。
# Google-Extended を閉じても AI Overviews への出現には影響しないと明記されている）
User-agent: Googlebot
Allow: /

# Apple（Siri・Spotlight の検索用）
User-agent: Applebot
Allow: /

# ---------------------------------------------------------------
# 利用者の操作をきっかけに、その場でページを取りに来るもの（歓迎する）
#
# 自動巡回ではなく「人が今このページについて質問した」ときのアクセス。
# 各社の文書に「robots.txt に従わないことがある」と書かれているものもある。
# ---------------------------------------------------------------

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Perplexity-User
Allow: /

# ---------------------------------------------------------------
# 基盤モデルの学習のためのクローラ（こちらも許可する）
#
# 上と違って、これは「モデルの学習データに含めてよいか」の話であり、
# 検索・引用とは別の判断になる。学習には使わせたくない場合は、
# この節の Allow を Disallow に変えれば、AI 検索での引用は保ったまま
# 学習だけを断れる。
# ---------------------------------------------------------------

# OpenAI（基盤モデルの学習）
User-agent: GPTBot
Allow: /

# Anthropic（モデルの学習）
User-agent: ClaudeBot
Allow: /

# Google（Gemini の学習・グラウンディング。検索順位には使われない）
User-agent: Google-Extended
Allow: /

# Apple（Apple Intelligence の学習）
User-agent: Applebot-Extended
Allow: /

# Meta
User-agent: meta-externalagent
Allow: /

# Common Crawl（多くのモデルが学習に使う公開アーカイブ）
User-agent: CCBot
Allow: /

Sitemap: ${sitemap}

# LLM 向けの案内は ${llms} にある（robots.txt の標準の指令ではないので、コメントとして書く）
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
