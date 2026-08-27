# 設計判断ログ 04: 再開手順書

最終更新: 2026-08-26

> **このファイルの目的**
> WebSearch 予算を上げるため Claude Code の再起動が必要になった。
> 再起動後のセッションが、このファイルだけを読んで続きから作業を再開できるようにする。
> **再開したらまずこのファイルを読むこと。**

> **注記（2026-08-27）**: 以下は **2026-08-26 時点のスナップショット**である。
> その後、調査ファイルと章はこの表よりも進んでいる。現状は `docs/research/` と
> `src/content/chapters/` の実際のファイルを見て判断すること。
> `_smoke.mdx` は削除済み（`06-first-writing-batch.md` の判断3の追記を参照）。
> 成果物を公開しない方針も撤回された（`00-grilling-outcome.md` の9節）。

---

## 1. いま何が終わっているか

### 設計（完了）
- `docs/decisions/00-grilling-outcome.md` — 全12問の決定 + 追加要望7件 + 撤回した判断
- `docs/decisions/01-structure.md` — 全29章＋付録3の構成
- `docs/decisions/02-style-guide.md` — 執筆ルール（**執筆前に必ず読ませる**）
- `docs/decisions/03-research-interruption.md` — 中断の経緯と教訓

### サイト基盤（完了・ビルド検証済み）
Astro 7.2.7 / Tailwind v4 / @lucide/astro / astro-pagefind

- `src/styles/global.css` — デザイントークン。**font-family は依頼者の明示指定。変更禁止**
- コンポーネント9種: `EvidenceBadge` `Callout` `Deep` `KeyPoints` `Experience`
  `Disputed` `TodayAction` `Checklist` `Term` `ThemeToggle`
- `src/layouts/BaseLayout.astro` / `ChapterLayout.astro`
- ページ: `/`（トップ）`/legend`（読み方・全コンポーネント見本）`/search`（Pagefind）
- `src/pages/chapters/[...slug].astro` — MDXにコンポーネントを注入している（**MDX側でimport不要**）

既知の注意点:
- Lucide の props は**ケバブケース**（`stroke-width`）。camelCase は無効属性として出力される
- 検索はビルド後のみ動作（`pnpm start`）。`pnpm dev` では動かない

### 調査（4/18 完了）
| ファイル | 状態 |
|---|---|
| `docs/research/01-evolution-domestication.md` | 完成・374行・出典44件 |
| `docs/research/02-senses-cognition.md` | 完成・434行・出典46件 |
| `docs/research/03-communication-social.md` | 完成・418行・出典43件 |
| `docs/research/05-acquisition-japan.md` | 完成・578行・脚注41件 |
| `docs/research/07-barking-PARTIAL.md` | **未完**。中断前の3発見のみ記録 |

### 執筆（5 / 29章 完了）
| 章 | 状態 |
|---|---|
| `04-where-from` 犬はどこから来たのか | 完成・3層構造の被覆100% |
| `05-their-world` 犬が感じている世界 | 完成・同上 |
| `06-their-mind` 犬が考えていること | 完成・同上 |
| `07-reading-signals` 犬のサインを読む | 完成・同上 |
| `10-where-to-get` どこから迎えるか | 完成・同上 |

本文の総量は約320KB。詳細は `06-first-writing-batch.md`。

`_smoke.mdx` は MDX の書き方の実例として**執筆エージェントに読ませるため残してある**。
`draft: true` にしてあるのでサイトには出ない。**全章が揃ったら削除してよい。**

### 付録（完成・自動生成）
`src/lib/extract.ts` が本文の MDX を解析し、ビルド時に生成する。手で書かない。
- `/appendix/glossary` 用語集（`<Term>` から。現在61語）
- `/appendix/disputed` 論争一覧（`<Disputed>` から。現在6件）
- `/appendix/sources` 出典一覧（脚注定義から。現在158件）

章を書き足すだけで自動的に増える。

---

## 2. 残っている調査（14領域）

再開時は **4〜6本ずつ** 起動する。18本同時起動が予算枯渇の原因だった。

| # | ファイル名 | 領域 | 優先度 |
|---|---|---|---|
| 06 | `06-training-modern.md` | 現代のトレーニング理論 | **最高**（章の骨格を決める） |
| 07 | `07-barking.md` | 吠え | **最高**（依頼者が最重視） |
| 08 | `08-biting-aggression.md` | 噛み・攻撃性 | **最高**（依頼者が最重視） |
| 09 | `09-socialization-puppy.md` | 社会化期と子犬の発達 | 高（やり直しがきかない） |
| 10 | `10-preventive-medicine.md` | 予防医療 | 高（日本と国際の差が最大） |
| 15 | `15-cost-insurance.md` | 費用とペット保険 | 高（依頼者の追加要望） |
| 16 | `16-housing-mobility-vet-access.md` | 住居・移動・病院アクセス | 高（住居未定のため） |
| 14 | `14-law-japan.md` | 法令・条例 | 中 |
| 04 | `04-breeds-size.md` | 犬種・サイズ別 | 中 |
| 11 | `11-nutrition.md` | 栄養 | 中 |
| 12 | `12-longevity-cognitive-decline.md` | 健康長寿・認知症 | 中 |
| 13 | `13-human-benefits.md` | 人間側のメリット | 中 |
| 17 | `17-experiences-ja.md` | 日本語の体験談 | 中 |
| 18 | `18-experiences-en.md` | 英語圏の体験談 | 中 |

**推奨する起動順**: 第1波 = 06, 07, 08, 09（行動系。最重要）
　　　　　　　　　第2波 = 10, 15, 16, 14（実務系）
　　　　　　　　　第3波 = 04, 11, 12, 13（知識系）
　　　　　　　　　第4波 = 17, 18（体験談）

各エージェントに与える指示のテンプレートは
`docs/decisions/05-research-prompts.md` に保存してある。

---

## 3. 調査エージェントへの必須の追加指示（今回の教訓）

前回なかったために問題が起きた指示。**必ず入れること。**

1. **「WebSearch は最大15回まで。それを超えたら WebFetch に切り替えること」**
   （予算はセッション全体で共有されるため）
2. **「URL が既知の一次情報は WebSearch を使わず WebFetch で直接取得すること」**
   PubMed / WSAVA / AVSAB / AVMA / e-Gov法令検索 / 環境省 / 国交省 / 自治体公式
3. **「報告書は WebSearch を使い切る前に、途中でも一度ファイルに書き出すこと」**
   （前回は書き出す前に中断され、成果が失われた）

---

## 4. 執筆の残り（24章 + 付録3）

`docs/decisions/01-structure.md` の章一覧に従う。
執筆エージェントには必ず以下を読ませること:
1. `docs/decisions/02-style-guide.md`
2. `docs/decisions/00-grilling-outcome.md`
3. `docs/decisions/01-structure.md`
4. `src/content/chapters/_smoke.mdx`（MDXの書き方の実例）

**執筆に WebSearch は不要**（調査ファイルだけを素材にする）。
執筆エージェントには「WebSearch を使うな。素材にない情報を記憶から補うな」と明示する。

---

## 5. 最後にやること

- [ ] `src/content/chapters/_smoke.mdx` を削除
- [ ] 付録3本を作る（論争一覧 / 用語集 / 出典一覧）
- [ ] `pnpm build` が通ることを確認
- [ ] `pnpm start` で実際に開いて、検索・チェックリスト・テーマ切替を手で確認
- [ ] `docs/decisions/` に最終的な統合判断（切り捨てた情報とその理由）を追記
