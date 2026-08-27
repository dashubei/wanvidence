/**
 * 章の MDX 本文から、付録（用語集・論争一覧・出典一覧）の素材を抽出する。
 *
 * 設計意図: 付録を手で二重管理すると、章を直したときに必ず食い違う。
 * 本文を唯一の情報源にして、付録はビルド時に生成する。
 */

export interface ChapterSource {
  id: string;
  title: string;
  order: number;
  body: string;
}

export interface TermEntry {
  term: string;
  desc: string;
  chapters: { id: string; title: string }[];
}

export interface DisputedEntry {
  topic: string;
  japan?: string;
  intl?: string;
  verdict?: string;
  ask?: string;
  chapter: { id: string; title: string; order: number };
}

export interface SourceEntry {
  key: string;
  text: string;
  chapters: { id: string; title: string }[];
  /** 本文中に URL も DOI もない出典に対して、原典を探すための検索リンクを用意する */
  searchUrl?: string;
}

/** 属性値を1つ取り出す。値の中に " が現れない前提（MDX の属性記法上そうなる） */
const attr = (block: string, name: string): string | undefined => {
  const m = block.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`));
  return m?.[1];
};

/** <Term desc="...">語</Term> を集めて、同じ語をまとめる */
export function extractTerms(chapters: ChapterSource[]): TermEntry[] {
  const map = new Map<string, TermEntry>();

  for (const ch of chapters) {
    for (const m of ch.body.matchAll(/<Term\b([^>]*?)>([\s\S]*?)<\/Term>/g)) {
      const attrs = m[1] ?? '';
      const desc = attr(attrs, 'desc');
      const word = attr(attrs, 'word') ?? (m[2] ?? '').trim();
      if (!desc || !word) continue;

      const existing = map.get(word);
      if (existing) {
        if (!existing.chapters.some((c) => c.id === ch.id)) {
          existing.chapters.push({ id: ch.id, title: ch.title });
        }
      } else {
        map.set(word, { term: word, desc, chapters: [{ id: ch.id, title: ch.title }] });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.term.localeCompare(b.term, 'ja'));
}

/** <Disputed ... /> を集める */
export function extractDisputed(chapters: ChapterSource[]): DisputedEntry[] {
  const out: DisputedEntry[] = [];

  for (const ch of chapters) {
    for (const m of ch.body.matchAll(/<Disputed\b([\s\S]*?)\/>/g)) {
      const block = m[1] ?? '';
      const topic = attr(block, 'topic');
      if (!topic) continue;
      out.push({
        topic,
        japan: attr(block, 'japan'),
        intl: attr(block, 'intl'),
        verdict: attr(block, 'verdict'),
        ask: attr(block, 'ask'),
        chapter: { id: ch.id, title: ch.title, order: ch.order },
      });
    }
  }

  return out.sort((a, b) => a.chapter.order - b.chapter.order);
}

/** 脚注定義 [^key]: 本文 を集めて、同じ出典をまとめる */
export function extractSources(chapters: ChapterSource[]): SourceEntry[] {
  const map = new Map<string, SourceEntry>();

  for (const ch of chapters) {
    for (const m of ch.body.matchAll(/^\[\^([^\]]+)\]:\s*([\s\S]*?)(?=\n\[\^|\n\n|\n*$)/gm)) {
      const key = (m[1] ?? '').trim();
      const text = (m[2] ?? '').trim().replace(/\s*\n\s*/g, ' ');
      if (!key || !text) continue;

      // 同じ文献が複数章で使われることがあるので、本文で名寄せする
      const dedupeKey = text.slice(0, 80);
      const existing = map.get(dedupeKey);
      if (existing) {
        if (!existing.chapters.some((c) => c.id === ch.id)) {
          existing.chapters.push({ id: ch.id, title: ch.title });
        }
      } else {
        map.set(dedupeKey, {
          key,
          text,
          chapters: [{ id: ch.id, title: ch.title }],
          searchUrl: buildSearchUrl(text),
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.text.localeCompare(b.text, 'en'));
}

/**
 * URL も DOI も持たない出典に、原典を探すための検索リンクを付ける。
 * 書誌情報は揃っているのにリンクだけない、というケースが実際に多く、
 * そのままだと読者が原典に当たる手段を失うため。
 */
function buildSearchUrl(text: string): string | undefined {
  if (/https?:\/\//.test(text)) return undefined;

  // 引用符で囲まれた論文タイトルがあればそれを使う
  const quoted = text.match(/["\u201c]([^"\u201d]{10,180})["\u201d]/);
  let query = quoted?.[1];

  if (!query) {
    // なければ、著者名と年までを手がかりにする
    const head = text.split(/[。．]/)[0] ?? text;
    query = head.slice(0, 120);
  }

  const q = query.trim();
  if (q.length < 8) return undefined;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`;
}

/**
 * 出典行を最小限だけ HTML にする。
 *
 * 順序が重要: リンクを作ったら、その中身に後続の置換がかからないよう
 * いったんプレースホルダに退避する。これをしないと、URL の中の DOI 番号に
 * 二重にリンクが張られ、href 属性が壊れる。
 */
export function lightMarkdown(s: string): string {
  const slots: string[] = [];
  const hold = (html: string) => {
    slots.push(html);
    return `@@LINK${slots.length - 1}@@`;
  };

  let out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 1. [表示文字](URL)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_m, text: string, url: string) =>
    hold(`<a href="${url}" rel="noreferrer">${text}</a>`),
  );

  // 2. 素の URL（末尾に付いた句読点はリンクから外す）
  out = out.replace(/https?:\/\/[^\s<@]+/g, (url: string) => {
    const trimmed = url.replace(/[.,、。）)\]】]+$/, '');
    return hold(`<a href="${trimmed}" rel="noreferrer">${trimmed}</a>`) + url.slice(trimmed.length);
  });

  // 3. 素の DOI 番号（1・2でリンク済みのものは退避済みなので当たらない）
  out = out.replace(/\b10\.\d{4,9}\/[^\s,、。）)\]】<@]+/g, (doi: string) =>
    hold(`<a href="https://doi.org/${doi}" rel="noreferrer">${doi}</a>`),
  );

  // 4. *斜体*（雑誌名に使われる）
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

  // 5. 退避したリンクを戻す
  return out.replace(/@@LINK(\d+)@@/g, (_m, i: string) => slots[Number(i)] ?? '');
}
