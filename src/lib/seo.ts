/**
 * SEO と構造化データ（JSON-LD）の組み立て。
 *
 * 設計意図:
 *   1. 名前・肩書き・説明文・ライセンスを「1箇所」に集める。改名するときに
 *      書き換えるのがこのファイルの先頭だけで済むようにする。
 *      （表示名を直に書いている箇所が他に残っていないかは
 *        `grep -rn Wanvidence src/` で確認できる）
 *   2. URL をハードコードしない。配信先（GitHub Pages のユーザーサイト /
 *      プロジェクトサイト / ローカル）が変わっても壊れないよう、
 *      オリジンは Astro が config から渡す `Astro.site`、
 *      ベースパスは `import.meta.env.BASE_URL` から取る。
 *   3. 出典・用語は本文から機械抽出する（`extract.ts` を再利用）。
 *      「出典が確認できない主張は書かない」という本の設計を、
 *      人間向けの表示だけでなく機械可読な形でも主張するため。
 */

import { extractSources, extractTerms, type ChapterSource } from './extract';
import { withBase } from './url';

// ───────────────────────────────────────────────────────────────
// 差し替え点。サイト名が確定したらここだけ直す
// ───────────────────────────────────────────────────────────────

/** サイト（本）の名前。読み: ワンビデンス。Wan + evidence の造語 */
export const SITE_NAME = 'Wanvidence';

/** トップページの `<title>` で名前のあとに続く短い説明。全角30字程度まで */
export const SITE_TAGLINE = '出典のない主張は書かない、犬と暮らすための29章';

/**
 * トップページの meta description・JSON-LD の description。
 *
 * 103字。あえて 120字まで伸ばしていない。
 * Google は日本語の description を全角70〜90字あたりで打ち切って表示するため、
 * 120〜160字（英語圏の慣行）に合わせて水増しすると、増やした分は表示されずに切れる。
 * 上限 160 は `fitDescription()` が機械的に守る。
 */
export const SITE_DESCRIPTION =
  '犬を初めて迎える人が意思決定するための29章。すべての記述に出典を付け、体験談と科学的根拠を分離し、' +
  '専門家の間で論争があるものは論争があると書いています。医療・法律の記述は獣医や専門家と話すための材料です。';

/**
 * 英語表記。本文の英語版は存在しない（README のみ英訳）ので、
 * ja のページの meta には出さない。使う先は README と llms.txt の英語要約だけ。
 * hreflang は不要（単一言語）。
 */
export const SITE_TAGLINE_EN = 'Evidence you can act on, before the dog.';
export const SITE_DESCRIPTION_EN =
  'Twenty-nine sourced chapters for deciding about, and living with, your first dog. ' +
  'Every claim carries a citation; lived experience is kept visually separate from evidence; ' +
  'genuine disputes are labelled as disputes.';

/**
 * 著者・発行者。GitHub のハンドル。
 * メールアドレスは公開されるので入れていない。
 */
export const AUTHOR: { type: 'Person' | 'Organization'; name: string } = {
  type: 'Person',
  name: 'dashubei',
};

/**
 * 本文のライセンス。JSON-LD の `license` に入れる。
 *
 * これは AI 検索に対して実質的な意味を持つ。「無料で読める」（isAccessibleForFree）と
 * 「非営利・継承の条件付き」（CC BY-NC-SA）を同時に機械可読で宣言することになるので、
 * 引用してよい／どう扱うべきかの判断材料をクローラ側に渡せる。
 * リポジトリの LICENSE-CONTENT と同じことを主張する形。
 */
export const CONTENT_LICENSE = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';

/**
 * コードのライセンス。JSON-LD には**入れていない**。
 *
 * JSON-LD が記述している対象は本（Book / Article / WebPage）であって
 * リポジトリのソースではない。ここに MIT を混ぜると
 * 「本文が MIT」と読める余地が出るため、コード側は LICENSE ファイルだけで主張する。
 */
export const CODE_LICENSE = 'https://opensource.org/licenses/MIT';

export const SITE_LANG = 'ja';
export const SITE_LOCALE = 'ja_JP';

/**
 * `Astro.site` が未設定のときに使うオリジン。
 * astro.config.mjs の既定値（環境変数 SITE 未設定時）と揃えてある。
 */
export const FALLBACK_ORIGIN = 'http://localhost:4321';

/**
 * Google Search Console の所有権確認トークン（HTML タグ方式）。
 *
 * 全ページに出している。Google が見るのはプロパティのルート（トップページ）だけだが、
 * 1ページだけに置くと、そのページの構造を変えたときに黙って確認が外れる。
 * 圧縮後の増分は無視できる大きさなので、堅牢さを取っている。
 *
 * 空文字にすると出力されない。確認が済んだあとも消さないこと
 * （消すと Search Console の所有権が失効する）。
 */
export const GOOGLE_SITE_VERIFICATION = 'TXR5b58kBJ8bCaa2cT0MQHHlWFwkBeA_j0Cvq4iKjhI';

/**
 * OG 画像のパス（サイト内の絶対パス。base は自動で付く）。
 *
 * `public/og.png` を指している。これが undefined でない限り、Seo.astro は
 * og:image 一式を出し、Twitter Card を summary_large_image にする。
 *
 * 画像の中身: --c-accent の地に --c-text-invert で「Wanvidence」と
 * SITE_TAGLINE の2行、favicon.svg と同じ肉球。フォントは global.css の
 * --font-sans と同じ指定で組んである。
 * 差し替えるときの条件は3つだけ:
 *   ・1200x630 で、下の OG_IMAGE_SIZE と一致させる（数値だけ直すと嘘になる）
 *   ・不透過（透過 PNG は SNS 側で黒や白に塗り潰される）
 *   ・約500px 幅に縮小しても読めること（Twitter / Slack はその程度で表示する）
 * 章ごとに別画像は作っていない。ビルド時に29枚を生成するには依存の追加が必要で、
 * 得られるものが「章名が入る」だけのため。全ページがこの1枚を共有する。
 */
export const DEFAULT_OG_IMAGE: string | undefined = '/og.png';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

/**
 * `/search` が `?q=` を読むようになったら true にする。
 *
 * なぜ既定で false か:
 *   現在の search.astro は入力欄の変化しか見ておらず、URL のクエリを読まない。
 *   `SearchAction` の urlTemplate は「この URL に飛ばせば検索結果が出る」という約束なので、
 *   読まないまま宣言すると嘘になる。パッチを当ててから true にする。
 */
export const SEARCH_QUERY_PARAM_SUPPORTED = false;

/**
 * 章ページの JSON-LD の型。
 *
 * `Chapter` は意味としては最も正確だが、Google がリッチリザルトの対象として
 * 公式に挙げているのは Article / NewsArticle / BlogPosting である。
 * 両方を並べて宣言している（JSON-LD の多重型は仕様上妥当）。
 * 保守的にするなら 'Chapter' を外して ['Article'] にする。
 */
export const CHAPTER_TYPES = ['Article', 'Chapter'];

/** meta description の目安。上限は必ず守る。下限は「届けば嬉しい」程度の目標 */
export const DESC_MAX = 160;
export const DESC_SOFT_MIN = 110;

/** 1ページに載せる citation の上限。異常に増えたときの安全弁 */
export const CITATION_LIMIT = 60;

// ───────────────────────────────────────────────────────────────
// URL の組み立て
// ───────────────────────────────────────────────────────────────

/**
 * 配信先のオリジンを決める。
 *
 * 想定している渡し方は `SITE=https://<user>.github.io BASE=/<repo>` だが、
 * `SITE` にパスまで入れてしまう運用もありうる。その場合はパスを base として拾い直す。
 */
function resolveSite(site?: URL | string): { origin: string; sitePath: string } {
  let url: URL;
  try {
    url = new URL(String(site ?? FALLBACK_ORIGIN));
  } catch {
    url = new URL(FALLBACK_ORIGIN);
  }
  return { origin: url.origin, sitePath: url.pathname.replace(/\/+$/, '') };
}

/** ディレクトリを指すパスの末尾スラッシュを揃える。拡張子付き（= ファイル）はそのまま */
export function withTrailingSlash(pathname: string): string {
  if (pathname.endsWith('/')) return pathname;
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  return last.includes('.') ? pathname : `${pathname}/`;
}

/**
 * サイト内の絶対パス（例 `/legend`）から、絶対 URL を作る。
 * base は `withBase` が付ける。
 */
export function absoluteUrl(path: string, site?: URL | string): string {
  const { origin, sitePath } = resolveSite(site);
  let p = withBase(path);
  // SITE 側にパスが入っていて BASE が '/' のときの取りこぼしを補う
  if (sitePath && !p.startsWith(`${sitePath}/`) && p !== sitePath) {
    p = `${sitePath}${p}`;
  }
  return new URL(withTrailingSlash(p), origin).href;
}

/**
 * `Astro.url.pathname`（すでに base を含む）から絶対 URL を作る。
 * canonical に使う。
 */
export function canonicalUrl(pathname: string, site?: URL | string): string {
  const { origin } = resolveSite(site);
  return new URL(withTrailingSlash(pathname), origin).href;
}

// ───────────────────────────────────────────────────────────────
// テキストの整形
// ───────────────────────────────────────────────────────────────

const collapse = (s: string): string => s.replace(/\s+/g, ' ').trim();

/**
 * 長すぎる説明文を、文が壊れない位置で切る。
 *
 * 機械的に n 文字で切ると日本語は途中で切れて意味が反転することがあるので、
 * 句点 → 読点 → 字数、の順で切る位置を探す。
 */
export function truncateAtSentence(text: string, max: number): string {
  const s = collapse(text);
  if (s.length <= max) return s;

  const head = s.slice(0, max);
  const floor = Math.floor(max * 0.6);

  const period = Math.max(head.lastIndexOf('。'), head.lastIndexOf('．'));
  if (period >= floor) return head.slice(0, period + 1);

  const comma = Math.max(head.lastIndexOf('、'), head.lastIndexOf('，'));
  if (comma >= floor) return `${head.slice(0, comma)}…`;

  return `${head.slice(0, max - 1)}…`;
}

/**
 * meta description を作る。
 *
 * 短い要約には、実際に frontmatter にある `audience`（この章を読むとよい人）を足す。
 * 字数を稼ぐための水増しはしない。足しても下限に届かないことはあるが、
 * それは「その章の要約が短い」という事実であって、埋める理由にはならない。
 */
export function fitDescription(summary: string, extra?: string): string {
  let s = collapse(summary);

  if (extra && s.length < DESC_SOFT_MIN) {
    const tail = collapse(extra);
    const joiner = /[。．！？]$/.test(s) ? '' : '。';
    const merged = `${s}${joiner}${tail}`;
    if (merged.length <= DESC_MAX) s = merged;
  }

  return truncateAtSentence(s, DESC_MAX);
}

/** `<title>` を組む。60字を超えたらページ側のタイトルだけを詰める */
export function pageTitle(title: string | undefined, isHome: boolean): string {
  if (isHome || !title || title === SITE_NAME) return `${SITE_NAME} | ${SITE_TAGLINE}`;

  const suffix = ` | ${SITE_NAME}`;
  const room = 60 - suffix.length;
  const head = title.length <= room ? title : truncateAtSentence(title, room);
  return `${head}${suffix}`;
}

// ───────────────────────────────────────────────────────────────
// 本文からの抽出（出典・用語）
// ───────────────────────────────────────────────────────────────

export interface Citation {
  name: string;
  url?: string;
}

/** 出典テキストから、原典に飛べる URL を1つだけ取り出す */
function citationUrl(text: string): string | undefined {
  const link = text.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/);
  if (link?.[1]) return link[1];

  const bare = text.match(/https?:\/\/[^\s<)）]+/);
  if (bare?.[0]) return bare[0].replace(/[.,、。）)\]】]+$/, '');

  const doi = text.match(/\b10\.\d{4,9}\/[^\s,、。）)\]】]+/);
  if (doi?.[0]) return `https://doi.org/${doi[0]}`;

  return undefined;
}

/** 表示用に、出典テキストから Markdown 記法と URL を落として書誌情報だけ残す */
function citationName(text: string): string {
  return collapse(
    text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\*/g, '')
      .replace(/\s*[（(]\s*[）)]\s*/g, ' '),
  ).slice(0, 300);
}

/**
 * 章の本文（MDX）から、脚注定義を citation の配列にする。
 *
 * 抽出そのものは付録と同じ `extract.ts` を使う。付録と JSON-LD で
 * 別々の正規表現を持つと、いつか必ず食い違うため。
 */
export function chapterCitations(chapter: ChapterSource, limit = CITATION_LIMIT): Citation[] {
  return extractSources([chapter])
    .map((s) => ({ name: citationName(s.text), url: citationUrl(s.text) }))
    .filter((c) => c.name.length >= 8)
    .slice(0, limit);
}

/** 章の本文から `<Term>` の語を集めて keywords にする */
export function chapterKeywords(chapter: ChapterSource, limit = 20): string[] {
  return extractTerms([chapter])
    .map((t) => t.term)
    .slice(0, limit);
}

// ───────────────────────────────────────────────────────────────
// JSON-LD
// ───────────────────────────────────────────────────────────────

type Node = Record<string, unknown>;

export interface ChapterSeo {
  id: string;
  title: string;
  part: string;
  summary: string;
  order: number;
  audience?: string;
  updated?: string;
  /** 出典・用語の抽出元。省略すると citation / keywords が出ない */
  body?: string;
}

export interface ChapterListItem {
  id: string;
  title: string;
  summary: string;
  order: number;
  part: string;
}

export interface GraphInput {
  site?: URL | string;
  /** canonical（絶対 URL） */
  url: string;
  /** `<title>` に出す完全なタイトル */
  fullTitle: string;
  description: string;
  kind: 'home' | 'chapter' | 'page';
  /** WebPage の型。目次的なページは CollectionPage のほうが正確 */
  pageType?: 'WebPage' | 'CollectionPage';
  chapter?: ChapterSeo;
  /** トップページで Book.hasPart を作るための全章 */
  chapters?: ChapterListItem[];
  breadcrumbs?: { name: string; path?: string }[];
  /**
   * 用語集ページ用。渡すと DefinedTermSet を出す。
   *
   * 既定では渡していない。207語で JSON-LD が 57.9 KiB（gzip 15.1 KiB）になり、
   * 用語集ページの転送量を大きく増やすのに対して、得られるものが薄いため。
   * あのページの HTML はすでに「語 + 定義」の対を並べていて、機械にも読める。
   * つまり JSON-LD は同じ情報を3倍の重さで運び直すだけになる。
   * （章の citation を出しているのは逆の理由。「この章がこの文献を根拠にしている」
   *   という関係は、脚注の HTML からは機械的に復元できないため）
   * 必要になったら用語集ページから terms を渡すだけで有効になる。
   */
  terms?: { term: string; desc: string }[];
  image?: string;
}

const ids = (site: URL | string | undefined) => {
  const home = absoluteUrl('/', site);
  return {
    home,
    website: `${home}#website`,
    publisher: `${home}#publisher`,
    book: `${home}#book`,
  };
};

function authorNode(site?: URL | string): Node {
  return {
    '@type': AUTHOR.type,
    '@id': ids(site).publisher,
    name: AUTHOR.name,
    url: ids(site).home,
  };
}

/** 章の @id。トップページの Book.hasPart と章ページの Article が同じ節点を指すようにする */
export function chapterNodeId(chapterId: string, site?: URL | string): string {
  return `${absoluteUrl(`/chapters/${chapterId}`, site)}#chapter`;
}

function breadcrumbNode(
  items: { name: string; path?: string }[],
  site: URL | string | undefined,
  pageUrl: string,
): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((it, i) => {
      const el: Node = { '@type': 'ListItem', position: i + 1, name: it.name };
      // 最後の要素だけ item を省略できる（現在地なので）
      if (it.path !== undefined) el.item = absoluteUrl(it.path, site);
      return el;
    }),
  };
}

function citationNodes(cites: Citation[]): Node[] {
  return cites.map((c) => {
    const n: Node = { '@type': 'CreativeWork', name: c.name };
    if (c.url) n.url = c.url;
    return n;
  });
}

/**
 * ページ1枚分の JSON-LD（`@graph`）を組む。
 *
 * 節点の作り方:
 *   - WebSite / 発行者 / Book はサイト全体で同じ @id を使い、どのページからも同じものを指す
 *   - 章は `<章URL>#chapter` を @id にして、トップページの Book.hasPart と
 *     章ページの Article が同一の節点になるようにする
 */
export function buildGraph(input: GraphInput): Node {
  const { site, url, fullTitle, description, kind } = input;
  const id = ids(site);
  const graph: Node[] = [];

  // --- WebSite ---
  const website: Node = {
    '@type': 'WebSite',
    '@id': id.website,
    url: id.home,
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANG,
    publisher: { '@id': id.publisher },
  };
  if (SEARCH_QUERY_PARAM_SUPPORTED) {
    website.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/search', site)}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }
  graph.push(website);

  // --- 発行者 ---
  graph.push(authorNode(site));

  // --- WebPage ---
  const webpage: Node = {
    '@type': input.pageType ?? (kind === 'home' ? 'CollectionPage' : 'WebPage'),
    '@id': `${url}#webpage`,
    url,
    name: fullTitle,
    description,
    isPartOf: { '@id': id.website },
    inLanguage: SITE_LANG,
    isAccessibleForFree: true,
    license: CONTENT_LICENSE,
  };
  if (input.breadcrumbs?.length) {
    webpage.breadcrumb = { '@id': `${url}#breadcrumb` };
    graph.push(breadcrumbNode(input.breadcrumbs, site, url));
  }
  if (input.chapter?.updated) {
    webpage.datePublished = input.chapter.updated;
    webpage.dateModified = input.chapter.updated;
  }
  graph.push(webpage);

  // --- Book ---
  // どのページでも最低限の Book 節点を置く。章ページの isPartOf が
  // 型も名前もない節点を指す（= 何の一部か分からない）状態を避けるため。
  const book: Node = {
    '@type': 'Book',
    '@id': id.book,
    name: SITE_NAME,
    url: id.home,
    inLanguage: SITE_LANG,
    bookFormat: 'https://schema.org/EBook',
    isAccessibleForFree: true,
    license: CONTENT_LICENSE,
    author: { '@id': id.publisher },
    publisher: { '@id': id.publisher },
  };
  if (kind === 'home') {
    book.description = SITE_DESCRIPTION;
    // numberOfPages は「紙の総ページ数」の意味なので使わない。章数は hasPart の長さで表す
    if (input.chapters?.length) {
      book.hasPart = input.chapters.map((ch) => ({
        '@type': CHAPTER_TYPES,
        '@id': chapterNodeId(ch.id, site),
        name: ch.title,
        url: absoluteUrl(`/chapters/${ch.id}`, site),
        abstract: truncateAtSentence(ch.summary, DESC_MAX),
        position: ch.order,
        isPartOf: { '@id': id.book },
      }));
    }
  }
  graph.push(book);

  // --- 章（Article + Chapter） ---
  if (kind === 'chapter' && input.chapter) {
    const ch = input.chapter;
    const article: Node = {
      '@type': CHAPTER_TYPES,
      '@id': `${url}#chapter`,
      headline: ch.title,
      name: ch.title,
      description,
      // abstract は description と同じ文になるので出さない（同じ文を2回運ぶ意味がない）
      url,
      position: ch.order,
      inLanguage: SITE_LANG,
      isAccessibleForFree: true,
      license: CONTENT_LICENSE,
      author: { '@id': id.publisher },
      publisher: { '@id': id.publisher },
      isPartOf: { '@id': id.book },
      mainEntityOfPage: { '@id': `${url}#webpage` },
    };
    if (ch.updated) {
      article.datePublished = ch.updated;
      article.dateModified = ch.updated;
    }
    if (ch.audience) article.audience = { '@type': 'Audience', audienceType: ch.audience };
    if (input.image) article.image = input.image;

    if (ch.body) {
      const source: ChapterSource = {
        id: ch.id,
        title: ch.title,
        order: ch.order,
        body: ch.body,
      };
      const cites = chapterCitations(source);
      if (cites.length) article.citation = citationNodes(cites);
      const keywords = chapterKeywords(source);
      if (keywords.length) article.keywords = keywords;
    }

    graph.push(article);
  }

  // --- 用語集（DefinedTermSet） ---
  if (input.terms?.length) {
    graph.push({
      '@type': 'DefinedTermSet',
      '@id': `${url}#glossary`,
      name: `${SITE_NAME} 用語集`,
      url,
      inLanguage: SITE_LANG,
      hasDefinedTerm: input.terms.map((t) => ({
        '@type': 'DefinedTerm',
        name: t.term,
        description: truncateAtSentence(t.desc, 300),
        inDefinedTermSet: { '@id': `${url}#glossary` },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** JSON-LD を `<script>` に埋め込める文字列にする。`</script>` の混入を防ぐ */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
