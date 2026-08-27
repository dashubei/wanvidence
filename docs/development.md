# 開発ドキュメント

`README.md` はサービスの紹介だけです。手元で動かす、本文を書き足す、デプロイする —
そういう作業の記録はこちらにまとめています。

パスはリポジトリのルートからの相対で書いています。

公開 URL は `README.md` と `README.en.md` にそれぞれ1行だけ書いてあります。
GitHub のユーザー名が変わったときは、その2行を直せば済みます。

## ローカルで動かす

```bash
corepack enable    # package.json の packageManager どおりの pnpm を使う
pnpm install       # 初回のみ。git hooks もここで入る
pnpm start         # ビルドして http://localhost:4321 で開く
```

Node は `.nvmrc` の 24 を想定しています（`engines` は Node 22.12 以上・pnpm 11 以上）。

**読むときは `pnpm start` を使ってください。**
ビルドしてから配信するので、章の追加も全文検索も反映されます。29章で10秒前後です。

### `pnpm dev` の2つの落とし穴

```bash
pnpm dev    # 速い。ただし下の2つが動かない
```

1. **章を追加しても目次に出ない。**
   開発サーバーは、起動した時点のコンテンツを読み込みます。
   起動後に追加した章は、**サーバーを再起動するまで出てきません**
2. **全文検索が動かない。**
   検索の索引（Pagefind）はビルド時にしか作られません

過去に「目次が消えた」と誤解する事故が実際に起きています。
原因は、章が数本しかなかった頃に起動した開発サーバーを、そのまま見続けていたことでした。

**表示がおかしいと思ったら、まず `pnpm start` で確認してください。**

```bash
# 古いサーバーが残っていないか確認する
ps aux | grep -E 'astro dev|serve' | grep -v grep
```

検索は日本語の全文検索です（Pagefind が CJK を索引します）。日本語で入れてください。

## ディレクトリ

```
docs/
  development.md            このファイル
  research/                 18領域の調査報告。無編集で保存してある
  decisions/                設計判断のログ。何を決め、何を捨て、なぜそうしたか
  manuscript/before-plain/  平易化する前の原稿
src/
  content/chapters/   本文（MDX・29章）
  content.config.ts   frontmatter のスキーマ
  components/         KeyPoints / Deep / Callout / EvidenceBadge / Experience /
                      Disputed / TodayAction / Checklist / Term ほか
  layouts/            ページの骨格（BaseLayout / ChapterLayout）
  lib/extract.ts      本文から付録の素材を抽出する
  lib/url.ts          withBase()。ベースパス付きのリンクを作る
  pages/              トップ・読み方（legend）・検索・付録・章・sitemap・robots・llms.txt
  styles/global.css   デザイントークン（色・タイポグラフィ）
scripts/
  check.mjs           原稿の健康診断
  check-seo.mjs       ビルド結果の SEO 検証
  a11y-audit.mjs      ビルド結果のアクセシビリティ検査
```

`docs/decisions/00-grilling-outcome.md` に、この本の設計を決めた一問一答の全記録があります。
前提が変わったときは、そこから読み直すのが早いです。

## 本文を書き足す

1. `docs/decisions/02-style-guide.md`（執筆ルール）と
   `docs/decisions/11-plain-language-guide.md`（平易化の基準）を読む
2. `src/content/chapters/` に `.mdx` を置く。並び順は frontmatter の `partOrder` と `order`
3. `pnpm start` で表示を確認する（`pnpm dev` では目次に出ません）

frontmatter のスキーマは `src/content.config.ts` にあります。

| キー | 必須 | 内容 |
|---|---|---|
| `title` | 必須 | 章タイトル |
| `part` | 必須 | 部の名前（例: `第1部 決める前に`） |
| `partOrder` | 必須 | 部の並び順 |
| `order` | 必須 | 全体を通した章の並び順 |
| `summary` | 必須 | 目次カードに出す1〜2文 |
| `navTitle` | 任意 | 一覧やナビで使う短い見出し。省略時は `title` |
| `icon` | 任意 | Lucide のアイコン名（PascalCase・既定は `BookOpen`） |
| `audience` | 任意 | この章を読むべき人・場面 |
| `updated` | 任意 | 最終更新日 |
| `draft` | 任意 | `true` のあいだは一覧から隠れる（既定は `false`） |

### 実際に踏んだ落とし穴

- **コンポーネントは import 不要。**
  `KeyPoints` `Deep` `Callout` `EvidenceBadge` `Experience` `Disputed` `TodayAction`
  `Checklist` `Term` は `src/pages/chapters/[...slug].astro` が注入しています
- **`items={[...]}` の中にコンポーネントと Markdown を書かない。**
  配列の要素は `set:html` で生の HTML として挿入されるため、`<Term>` も脚注 `[^1]` も
  展開されません。**ビルドは通り、見た目も壊れず、機能だけが静かに消えます。**
  使えるのは `<strong>` `<em>` `<code>` `<a href="...">` だけです
- **`<` の直後に英字を続けない。**
  MDX が JSX のタグ開始と見なして、ビルドが落ちます（`p<0.01` で実際に落ちました）。
  `&lt;` か全角の「＜」を使うか、「p は 0.01 未満」と日本語で書きます。
  `{` `}` も同じ理由で避けます
- **Lucide の props はケバブケース。** `stroke-width` です。
  camelCase は無効な属性として出力され、黙って効きません
- **`Checklist` の `id` は文書全体で一意にする。** localStorage の保存キーになります
- **付録は手で書かない。**
  用語集・論争一覧・出典一覧は、`src/lib/extract.ts` が本文の `<Term>` `<Disputed>` と
  脚注から自動生成します。手で二重管理すると、章を直したときに必ず食い違います
- **サイト内リンクは `withBase()` を通す。**
  GitHub Pages のプロジェクトサイトは `/<repo>/` の下に出るので、
  `href="/legend"` のような絶対パスは全部リンク切れになります

## 依存で触ってはいけないもの

`package.json` の次の2つは、**キャレット（`^`）を付けずに完全固定しています。**
「揃っていないから直そう」と思ったら、先にここを読んでください。

### `@astrojs/markdown-remark` は `7.2.4` に完全固定する

astro 7.2.7 は、このパッケージを**完全一致の optional peerDependency** として
宣言しています。キャレットではありません。

```json
"peerDependencies": { "@astrojs/markdown-remark": "7.2.4" }
```

したがって `^7.2.4` にすると、7.2.5 が出た時点で astro の peer 要求に違反し、
**astro が使う版と `astro.config.mjs` が import する版が食い違います。**
`markdown.processor` に渡す `unified()` は astro 本体と同じ版から来る必要があります。

astro を上げるときは、上げた版の `peerDependencies` を読んで、この行を
その版に合わせてください。ズレていれば `pnpm install` が peer 警告で教えてくれます。

そもそも直接依存に入れているのは、pnpm の厳密リンクでは推移的依存を
`import` できないためです（`unist-util-visit` も同じ理由で直接依存にしています）。

### `unist-util-visit` は `5.1.0` に固定する

`src/lib/rehype-chapter-links.mjs` が import しています。
npm のフラットな `node_modules` では、Astro の依存として入っていたものが
偶然解決できていました。pnpm に移行したときにビルドが落ちて判明したものです。

## 検査コマンド

リンターとフォーマッターは oxc（oxlint / oxfmt）。
CI は GitHub Actions ではなく、lefthook（git hooks）で手元で回します。

```bash
pnpm lint            # oxlint
pnpm lint:fix        # oxlint --fix
pnpm format          # oxfmt（ファイルを書き換える）
pnpm format:check    # oxfmt --check
pnpm typecheck       # astro check
pnpm check           # 原稿の健康診断
pnpm build           # ビルドのみ
pnpm preview         # astro preview
```

`pnpm check`（`scripts/check.mjs`）が見るもの:

1. **読みやすさ** — 一文の平均文字数、漢字率、章の字数
2. **MDX の落とし穴** — `items` の中に混ざったコンポーネントと Markdown 記法
3. **脚注** — 参照 `[^1]` に対応する定義があるか
4. **章参照のズレ** — 「第N章（ラベル）」が実際の章タイトルと合っているか

全部、実際に事故が起きた項目です。手で確認すると見落とすので、コマンドにしています。

ビルド結果を見る検査は別に2つあります。どちらも `dist/` を読むので、`pnpm build` のあとに実行します。

```bash
node scripts/check-seo.mjs     # sitemap / robots / llms.txt / JSON-LD / head
node scripts/a11y-audit.mjs    # 見出し階層 / ランドマーク / 表 / id 重複 / lang
```

`a11y-audit.mjs` は35ページ全部を機械的に見ます。本文が MDX なので見出しの飛びや
h1 の重複は実際に起きます（`18-biting.mdx` で h1 が3個になっていたのはこれで見つけました）。

## lefthook がいつ何を走らせるか

hooks は `pnpm install` で入ります（`prepare` が `lefthook install` を呼びます）。

| いつ | 何を | 対象 |
|---|---|---|
| pre-commit | `oxfmt` | ステージした `.ts` `.mts` `.cts` `.js` `.mjs` `.cjs` |
| pre-commit | `oxlint --fix` | 上に `.astro` を加えたもの |
| pre-commit | `pnpm check` | `.mdx` を変更したときだけ。**コミットは止めません** |
| pre-push | `astro check` → `oxlint`（全体）→ `astro build` | リポジトリ全体 |

- pre-commit は `parallel: false` です。`oxfmt` と `oxlint --fix` は同じファイルを
  書き換えるので、同時に走らせると書き込みが競合します
- `oxfmt` の対象から `.astro` を外しているのは、oxfmt が `.astro` を扱えないためです
  （明示的に渡すと exit 2 になります）。`.mdx` `.md` `.css` `.json` は `.oxfmtrc.json`
  側で除外しています。原稿の書式と、手で列を揃えた `global.css` を壊さないためです
- `pnpm check` には `|| true` が付いていて、意図的にコミットを止めていません。
  読みやすさの目標に未達の章があり、章参照の検出も誤検知を含みます。
  いま止めると何もコミットできません。原稿が固まったら `|| true` を外してゲートにできます
- 型チェックとビルドは pre-push 側です。29章のビルドに10秒前後かかります

hooks を一時的に飛ばす:

```bash
LEFTHOOK=0 git commit -m "wip"              # lefthook 全体を無効にする
git commit --no-verify -m "wip"             # git 側で hook を飛ばす
LEFTHOOK_EXCLUDE=lint git commit -m "wip"   # job 名を指定して1つだけ飛ばす
```

手で回す / 張り直す:

```bash
pnpm exec lefthook run pre-commit --all-files
pnpm exec lefthook validate
pnpm run prepare    # hooks を張り直す
```

各自の環境用の上書きは `lefthook-local.yml` に書きます（`.gitignore` 済み）。

## デプロイ

`main` に push すると `.github/workflows/deploy.yml` が動き、GitHub Pages に出ます。
Actions タブから手で流すこともできます（`workflow_dispatch`）。
`pnpm install --frozen-lockfile` → `pnpm run build` の2手だけで、
リンターとテストはここでは走らせません（lefthook 側でやる方針）。

**リポジトリ名は、ワークフローにもコードにも書いてありません。**
`actions/configure-pages` が実行時に返す配信先（`origin` と `base_path`）を、
環境変数 `SITE` / `BASE` としてビルドに渡し、`astro.config.mjs` がそれを読みます。

```js
const site = process.env.SITE || 'http://localhost:4321';
const base = process.env.BASE || '/';
```

ユーザーサイト（`<user>.github.io`・base なし）でも、プロジェクトサイト
（base が `/<repo>`）でも、設定を書き換えずに動きます。
ローカルでは環境変数がないので、`http://localhost:4321` と `/` に落ちます。

デプロイの同時実行は `concurrency: group: pages` でまとめています。
走っているデプロイは止めません（途中で切ると、中途半端な状態が公開されます）。

初回だけ、リポジトリの Settings → Pages で Source を GitHub Actions にします。

### 既知の制約: robots.txt と llms.txt がクローラに読まれない

プロジェクトサイトで配信しているので、生成した `robots.txt` は
`/wanvidence/robots.txt` に出ます。**robots.txt はオリジン直下のものだけが
読まれる仕様（RFC 9309）なので、クローラはこれを読みません。**

クロール自体は止まりません（robots.txt が無いオリジンは全許可と解釈される）。
失われるのは `Sitemap:` 行による自動発見と、AI クローラ向けの使い分けです。

**コードの問題ではなく配信先の形の問題です。** 原因と回避方法（貼るだけの
robots.txt を含む）は [`docs/decisions/13-origin-root-limitation.md`](decisions/13-origin-root-limitation.md)
にあります。robots.txt が効いていないと気づいたとき、まずそこを読んでください。

## 貢献について

この本は、これから初めて犬を飼う一人の読者に向けて書きました。
汎用の情報サイトに広げる予定はありません。それでも、次のものは歓迎します。

- **事実の誤り**（Issue）。どの章のどの文か、そして**一次資料の URL か DOI** を
  添えてください。**出典のない指摘は、正しそうに見えても取り込めません。**
  これはこの本の第一の原則です
- **リンク切れ・誤字・ビルドの不具合**（Issue / PR）
- **出典付きの追記や訂正**（PR）。`docs/decisions/02-style-guide.md` と
  `docs/decisions/11-plain-language-guide.md` に従ってください。
  エビデンスバッジは、迷ったら弱い側に倒します

取り込まないもの:

- 出典のない主張、体験談の一般化、「〜と言われています」（誰が言ったのかを書く）
- 断定できないことを断定する書き換え
- 章構成の変更や章の追加の提案（構成は `docs/decisions/01-structure.md` で決めています）

体験談は歓迎します。ただし `<Experience>` の中に置き、「こう語られている」で止めます。
そこから「〜すべき」は導きません。

個人のプロジェクトなので、返信には時間がかかります。

## 章構成

8部・全29章。本文は `src/content/chapters/` にあります。

**第1部 決める前に** — 飼えるかどうかを、感情ではなく数字で判断する

1. [犬と暮らすと、人間に何が起きるか](../src/content/chapters/01-what-happens-to-you.mdx)
2. [本当のコスト — お金・時間・自由](../src/content/chapters/02-real-cost.mdx)
3. [あなたの条件で飼えるか](../src/content/chapters/03-can-you.mdx)

**第2部 犬という動物** — 後半のしつけ章の土台。犬の行動が理不尽に見える場面に納得を与える

4. [犬はどこから来たのか](../src/content/chapters/04-where-from.mdx)
5. [犬が感じている世界](../src/content/chapters/05-their-world.mdx)
6. [犬が考えていること](../src/content/chapters/06-their-mind.mdx)
7. [犬のサインを読む](../src/content/chapters/07-reading-signals.mdx)

**第3部 選ぶ・迎える** — 後から変えにくい決定

8. [サイズと用途群から読む](../src/content/chapters/08-breed-principles.mdx)
9. [日本の主要犬種カタログ](../src/content/chapters/09-breed-catalog.mdx)
10. [どこから迎えるか](../src/content/chapters/10-where-to-get.mdx)
11. [犬を前提に住む場所を決める](../src/content/chapters/11-choosing-home.mdx)
12. [迎える前の準備](../src/content/chapters/12-preparation.mdx)

**第4部 最初の1年** — やり直しがきかない期間

13. [社会化期 — やり直しがきかない数週間](../src/content/chapters/13-socialization.mdx)
14. [トイレ・クレート・留守番](../src/content/chapters/14-toilet-crate-alone.mdx)
15. [最初の壁 — 迎えた直後に起きること](../src/content/chapters/15-first-weeks.mdx)

**第5部 行動とトレーニング** — 吠えと噛みを最大の章に

16. [現代のトレーニングの土台](../src/content/chapters/16-training-foundation.mdx)
17. [吠え](../src/content/chapters/17-barking.mdx)
18. [噛みと攻撃性](../src/content/chapters/18-biting.mdx)
19. [日常の困りごと](../src/content/chapters/19-daily-problems.mdx)
20. [誰に相談するか](../src/content/chapters/20-who-to-ask.mdx)

**第6部 健康** — 日本の慣行と国際ガイドラインの差が最大の領域

21. [予防医療](../src/content/chapters/21-preventive.mdx)
22. [食事と栄養](../src/content/chapters/22-food.mdx)
23. [体重と運動](../src/content/chapters/23-weight-exercise.mdx)
24. [緊急時の判断](../src/content/chapters/24-emergency.mdx)

**第7部 長く健康に生きる** — 「病気になったら」ではなく「健康寿命をどう伸ばすか」

25. [健康寿命を伸ばす](../src/content/chapters/25-healthspan.mdx)
26. [認知症](../src/content/chapters/26-cognitive-decline.mdx)
27. [シニア期と看取り](../src/content/chapters/27-senior-and-farewell.mdx)

**第8部 お金と制度**

28. [ペット保険か、貯金か](../src/content/chapters/28-insurance-vs-savings.mdx)
29. [法律・条例・手続き](../src/content/chapters/29-law.mdx)

付録の3つ（論争のあるトピック・用語集・出典一覧）は本文から自動生成されます。
サイトの `/appendix/disputed` `/appendix/glossary` `/appendix/sources` にあります。
