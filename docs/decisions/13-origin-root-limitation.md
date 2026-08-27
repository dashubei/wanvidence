# robots.txt と llms.txt が読まれない問題

2026-08-27 記録。公開時に判明した制約と、その回避方法。

## 何が起きているか

このサイトは GitHub Pages の**プロジェクトサイト**として配信されている。

```
https://dashubei.github.io/wanvidence/
```

したがって、生成した `robots.txt` は次の場所に出る。

```
https://dashubei.github.io/wanvidence/robots.txt
```

**クローラはここを読まない。** robots.txt はオリジン（スキーム + ホスト + ポート）ごとに
1つだけと決まっていて、置き場所は必ずオリジン直下である（RFC 9309）。
クローラが取りに行くのは次の URL だけである。

```
https://dashubei.github.io/robots.txt
```

`llms.txt` も同じで、提案仕様はオリジン直下を前提にしている。

## 失われているもの / 失われていないもの

**失われていない**（重要）:

- **クロールは止まっていない。** robots.txt が存在しないオリジンは「全許可」と解釈される。
  検索エンジンも AI 検索クローラも、これまでどおり本文を読める
- `<meta name="robots">` は HTML の中にあるので効いている。`/search` の `noindex` も生きている
- sitemap.xml 自体は正しく生成され、絶対 URL で配信されている

**失われているもの**:

1. **`Sitemap:` 行による sitemap の自動発見。**
   Search Console から手で送信すれば代わりになる:
   `https://dashubei.github.io/wanvidence/sitemap.xml`
2. **`/pagefind/` の除外。** 全文検索の索引データ（数百ファイルの JSON とバイナリ断片）が
   クロール対象に残る。本文ではないので索引されても意味がないが、害もない
3. **AI クローラ向けの節。** 「AI 検索での引用は歓迎するが学習は断る」といった
   使い分けが、いま宣言できていない。全許可のままである
4. **`llms.txt` の慣行的な発見位置。** 中身は
   `https://dashubei.github.io/wanvidence/llms.txt` にあり、読ませたい相手に URL を
   直接渡せば読める。自動発見はされない

## 回避方法（1つだけ、確実に効くもの）

**`dashubei.github.io` という名前のリポジトリを作り、そこに robots.txt を置く。**

GitHub Pages では `<ユーザー名>.github.io` という名前のリポジトリだけがオリジン直下に
配信される（ユーザーサイト）。robots.txt はオリジン単位なので、そこに置いた1枚が
**同じオリジンにある全プロジェクトサイトに適用される。** `/wanvidence/` も含まれる。

作るもの: リポジトリ直下に `robots.txt` を1枚。中身は次のまま貼ればよい。

```
# https://dashubei.github.io/ 全体の robots.txt
#
# robots.txt はオリジンごとに1つで、置けるのは直下だけ（RFC 9309）。
# このファイルは配下の全プロジェクトサイトに適用される。

User-agent: *
Allow: /

# 全文検索の索引データ。本文ではないのでクロール不要。
Disallow: /wanvidence/pagefind/

# --- AI 検索・回答生成のためのクローラ（歓迎する） ---
# ユーザーの質問に答えるとき、出典としてこのサイトを引くためにクロールする。
# ここを閉じると AI の回答から引用・リンクされなくなる。
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: bingbot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Applebot
Allow: /

# --- 利用者の操作をきっかけに取りに来るもの（歓迎する） ---
User-agent: ChatGPT-User
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Perplexity-User
Allow: /

# --- 基盤モデルの学習のためのクローラ ---
# 検索での引用とは別の判断になる。学習だけ断りたければ、
# この節の Allow を Disallow に変えればよい（引用は保たれる）。
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://dashubei.github.io/wanvidence/sitemap.xml
```

同じリポジトリに `llms.txt` を置いて、本体へ案内するのもよい。

```
# dashubei.github.io

- [Wanvidence](https://dashubei.github.io/wanvidence/llms.txt): 出典のない主張は書かない、犬と暮らすための29章（日本語）
```

**注意**: ユーザーサイトは1アカウントに1つしか作れない。すでに
`dashubei.github.io` を別の用途で使っている場合は、その robots.txt に上の内容を
足す形になる。

## もう1つの解: 独自ドメイン

`wanvidence` リポジトリに独自ドメインを設定すると、そのドメインのオリジン直下に
配信されるので、生成している `robots.txt` と `llms.txt` がそのまま有効になる。
リポジトリを増やさずに済み、URL も短くなる。費用がかかるのが唯一の難点。

## この記録を残した理由

`src/pages/robots.txt.ts` は正しく動いていて、生成物にも問題がない。
**問題はコードではなく配信先の形にある。** コードを読んでも原因が分からないので、
ここに書いた。将来 robots.txt が効いていないことに気づいた人が、
プラグインの設定を疑って時間を使わないように。

`src/pages/robots.txt.ts` の冒頭コメントにも同じ制約を書いてある。
