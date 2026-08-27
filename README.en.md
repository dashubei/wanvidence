[日本語](README.md)

# Wanvidence

Evidence you can act on, before the dog.

**Live site: https://dashubei.github.io/wanvidence/**

A 29-chapter reference for people about to live with a dog for the first time. It puts
what research has actually established side by side with what owners actually report —
and never lets the two blur together. Every claim carries a badge saying how strong the
evidence behind it is.

Built with Astro as a static site. 29 chapters, roughly 470,000 Japanese characters,
with full-text search.

**The book is written in Japanese only.** There is no English edition of the prose. This
README is here so English readers can tell what the project is, decide whether it is
worth machine-translating, and work on the code.

This README spells out the public URL in exactly one place — the line above. If the
GitHub account is not `dashubei`, that single line is all you need to change.

## Read this first

- The medical, veterinary, and legal content is **material for a conversation with a
  vet, a trainer, or a lawyer** — not a substitute for their judgement.
  **Do not use this book to decide what to do about a dog that is symptomatic right now.**
- Statutes and guidelines change. Verify against primary sources before you act. Every
  chapter carries footnotes, and the site collects them all under "出典一覧" (Sources).
- The book is written **for a reader living in Japan**. Much of it assumes Japanese law,
  Japanese administrative procedure, and the practices of the Japanese pet industry —
  breeder and pet-shop norms, municipal registration, pet-friendly rental housing. Those
  premises do not transfer to other countries.
- Quoted papers, statistics, statutes, and personal accounts remain the property of their
  rights holders. See `LICENSE-CONTENT`.
- Checklist progress on the site is stored in the browser's `localStorage` only. Nothing
  is sent anywhere.

## What this is

Chapters are ordered by the decisions a prospective owner actually faces, not by
academic discipline. Part 1 is not canine biology; it is "can you even do this."

Every chapter has three layers:

| Layer | Implementation | Who it is for |
|---|---|---|
| 1 | `<KeyPoints>` | Someone in a hurry. Specific enough to act on without reading further |
| 2 | Body text | The standard reader. Jargon is introduced in everyday words first |
| 3 | `<Deep>` (collapsed) | The study itself: numbers, sample sizes, and its limitations |

### The five rules the book holds to

1. **No claim without a source we could verify.**
   Where the research came up empty, the book says so in the body — "we could not find a
   primary source for this" — instead of quietly dropping the topic. That admission is a
   lead for readers who want to dig further.
2. **Experience and evidence are visually separated.**
   Owner accounts live inside `<Experience>` blocks and nowhere else. They are never
   dissolved into the body text, and no "you should" is derived from them. They stop at
   "this is what people report."
3. **Where there is a real dispute, the book says there is a dispute.**
   `<Disputed>` puts common Japanese practice and international veterinary-association
   guidance in two columns. Where the evidence does not settle it, the book does not
   settle it either — instead it hands you the exact question to ask your vet.
4. **Every risk is stated next to what to do about it.**
   Risk information on its own makes people avoid the subject rather than change their
   behaviour, so a `<Callout type="danger">` never stands alone.
5. **No sentence ends with "this is important."**
   Claims are pushed down to a number, a procedure, a duration, or a failure mode.
   "Socialisation is important" is not a conclusion. "Between 3 and 14 weeks, at a
   distance the puppy chooses to close itself, under 5 minutes per session, three to five
   new stimuli a week" is a conclusion.

Evidence strength appears as a badge right after the claim, on five levels:

| Badge | Meaning |
|---|---|
| 強い根拠 (strong) | Systematic review, meta-analysis, RCT, or large cohort study |
| 中程度の根拠 (moderate) | A single observational study, or a mid-sized survey |
| 弱い根拠 (weak) | Expert opinion, small study, case report, or mechanistic reasoning |
| 体験談 (experience) | A personal account. Not evidence — a record of what is being said |
| 論争中 (disputed) | Studies conflict, or Japanese and international guidance diverge |

Technical terms are never simplified away. On first use they are wrapped in `<Term>` with
a plain-language gloss, because knowing the correct word is itself useful when you are
talking to a vet or a trainer.

### What this is not

- **Not an exhaustive breed encyclopedia.** The ~350 FCI-recognised breeds are out of
  scope. Instead: the principles you can read off size, coat, and working group, plus a
  catalogue of the breeds actually common in Japan.
- **Not a diagnosis or treatment manual.** Even the emergency chapter goes no further
  than "here is when to phone the clinic."
- **Not a neutral summary.** Claims are weighted by how strong the evidence is.

## Chapters

Eight parts, 29 chapters. Links go to the Japanese source (MDX); English glosses are
provided here for orientation only.

<details>
<summary>Full chapter list</summary>

**第1部 決める前に** — Before you decide: judge feasibility on numbers, not feelings

1. [犬と暮らすと、人間に何が起きるか](src/content/chapters/01-what-happens-to-you.mdx) — What living with a dog does to the human
2. [本当のコスト — お金・時間・自由](src/content/chapters/02-real-cost.mdx) — The real cost: money, time, freedom
3. [あなたの条件で飼えるか](src/content/chapters/03-can-you.mdx) — Can you keep a dog, given your circumstances

**第2部 犬という動物** — The animal itself: the groundwork the training chapters need

4. [犬はどこから来たのか](src/content/chapters/04-where-from.mdx) — Where dogs came from
5. [犬が感じている世界](src/content/chapters/05-their-world.mdx) — The world as a dog senses it
6. [犬が考えていること](src/content/chapters/06-their-mind.mdx) — What dogs are thinking
7. [犬のサインを読む](src/content/chapters/07-reading-signals.mdx) — Reading a dog's signals

**第3部 選ぶ・迎える** — Choosing and bringing one home: the decisions hardest to undo

8. [サイズと用途群から読む](src/content/chapters/08-breed-principles.mdx) — Reading a breed from its size and working group
9. [日本の主要犬種カタログ](src/content/chapters/09-breed-catalog.mdx) — Catalogue of the breeds common in Japan
10. [どこから迎えるか](src/content/chapters/10-where-to-get.mdx) — Where to get a dog (breeder, shop, shelter)
11. [犬を前提に住む場所を決める](src/content/chapters/11-choosing-home.mdx) — Choosing where to live with a dog in mind
12. [迎える前の準備](src/content/chapters/12-preparation.mdx) — Getting ready before the dog arrives

**第4部 最初の1年** — The first year: the window you do not get twice

13. [社会化期 — やり直しがきかない数週間](src/content/chapters/13-socialization.mdx) — The socialisation window
14. [トイレ・クレート・留守番](src/content/chapters/14-toilet-crate-alone.mdx) — Toileting, crate, time alone
15. [最初の壁 — 迎えた直後に起きること](src/content/chapters/15-first-weeks.mdx) — The first wall: what happens in week one

**第5部 行動とトレーニング** — Behaviour and training: barking and biting get the most space

16. [現代のトレーニングの土台](src/content/chapters/16-training-foundation.mdx) — The foundations of modern training
17. [吠え](src/content/chapters/17-barking.mdx) — Barking
18. [噛みと攻撃性](src/content/chapters/18-biting.mdx) — Biting and aggression
19. [日常の困りごと](src/content/chapters/19-daily-problems.mdx) — Everyday problems
20. [誰に相談するか](src/content/chapters/20-who-to-ask.mdx) — Who to ask for help

**第6部 健康** — Health: where Japanese practice and international guidance diverge most

21. [予防医療](src/content/chapters/21-preventive.mdx) — Preventive medicine
22. [食事と栄養](src/content/chapters/22-food.mdx) — Food and nutrition
23. [体重と運動](src/content/chapters/23-weight-exercise.mdx) — Weight and exercise
24. [緊急時の判断](src/content/chapters/24-emergency.mdx) — Emergencies: deciding when to act

**第7部 長く健康に生きる** — Living long and well: healthspan, not just lifespan

25. [健康寿命を伸ばす](src/content/chapters/25-healthspan.mdx) — Extending healthspan
26. [認知症](src/content/chapters/26-cognitive-decline.mdx) — Canine cognitive dysfunction
27. [シニア期と看取り](src/content/chapters/27-senior-and-farewell.mdx) — Old age and saying goodbye

**第8部 お金と制度** — Money and institutions

28. [ペット保険か、貯金か](src/content/chapters/28-insurance-vs-savings.mdx) — Pet insurance or savings
29. [法律・条例・手続き](src/content/chapters/29-law.mdx) — Japanese law, local ordinances, paperwork

</details>

Three appendices — disputed topics, glossary, and sources — are generated from the
chapter text rather than maintained by hand. On the site they live at
`/appendix/disputed`, `/appendix/glossary`, and `/appendix/sources`.

## Running it locally

```bash
corepack enable    # use the pnpm version pinned in package.json
pnpm install       # first time only; this also installs the git hooks
pnpm start         # build, then serve on http://localhost:4321
```

Node 24 is assumed (`.nvmrc`); `engines` requires Node 22.12+ and pnpm 11+.

**Use `pnpm start` when you want to read the book.** It builds first and then serves, so
new chapters appear and search works. A full build of 29 chapters takes about 10 seconds.

### Two traps in `pnpm dev`

```bash
pnpm dev    # fast, but two things do not work
```

1. **New chapters do not appear in the table of contents.** The dev server reads content
   at startup. A chapter added afterwards **will not show up until you restart it.**
2. **Full-text search does not work.** The Pagefind index is only built at build time.

This has already caused a real scare — someone concluded the table of contents had
vanished, when in fact they were looking at a dev server started back when only a handful
of chapters existed.

**If the page looks wrong, check with `pnpm start` before debugging anything else.**

```bash
# check for a stale server still running
ps aux | grep -E 'astro dev|serve' | grep -v grep
```

Search is Japanese-language full-text search (Pagefind indexes the CJK text), so query it
in Japanese.

## Layout

```
docs/
  research/                 18 research reports, stored unedited
  decisions/                design decisions: what was chosen, what was dropped, why
  manuscript/before-plain/  drafts as they stood before the plain-language pass
src/
  content/chapters/   the book (MDX, 29 chapters)
  content.config.ts   frontmatter schema
  components/         KeyPoints / Deep / Callout / EvidenceBadge / Experience /
                      Disputed / TodayAction / Checklist / Term, and others
  layouts/            page shells (BaseLayout / ChapterLayout)
  lib/extract.ts      pulls appendix material out of the chapter text
  lib/url.ts          withBase() — builds base-path-aware internal links
  pages/              home, reading guide (legend), search, appendices, chapters,
                      sitemap, robots, llms.txt
  styles/global.css   design tokens (colour, typography)
scripts/
  check.mjs           manuscript health check
  check-seo.mjs       post-build SEO verification
  a11y-audit.mjs      post-build accessibility audit
```

`docs/decisions/00-grilling-outcome.md` holds the full Q&A session that fixed the design
of the book. When a premise changes, that is the fastest place to start rereading.

## Adding a chapter

1. Read `docs/decisions/02-style-guide.md` (writing rules) and
   `docs/decisions/11-plain-language-guide.md` (plain-language standard).
2. Drop a `.mdx` file into `src/content/chapters/`. Ordering comes from the frontmatter
   fields `partOrder` and `order`.
3. Check it with `pnpm start` — `pnpm dev` will not list it.

The frontmatter schema lives in `src/content.config.ts`:

| Key | Required | Meaning |
|---|---|---|
| `title` | yes | Chapter title |
| `part` | yes | Part name (e.g. `第1部 決める前に`) |
| `partOrder` | yes | Order of the part |
| `order` | yes | Order of the chapter across the whole book |
| `summary` | yes | One or two sentences for the table-of-contents card |
| `navTitle` | no | Shorter title for lists and navigation; falls back to `title` |
| `icon` | no | Lucide icon name in PascalCase; defaults to `BookOpen` |
| `audience` | no | Who this chapter is for, and when to read it |
| `updated` | no | Last-updated date |
| `draft` | no | Hidden from listings while `true` (default `false`) |

### Traps we have actually fallen into

- **Components need no import.** `KeyPoints`, `Deep`, `Callout`, `EvidenceBadge`,
  `Experience`, `Disputed`, `TodayAction`, `Checklist`, and `Term` are injected by
  `src/pages/chapters/[...slug].astro`.
- **Never put components or Markdown inside `items={[...]}`.** Array entries are inserted
  as raw HTML via `set:html`, so `<Term>` and footnote references like `[^1]` are not
  expanded. **The build passes, the page looks fine, and the functionality silently
  disappears.** Only bare HTML works there: `<strong>`, `<em>`, `<code>`, `<a href="...">`.
- **Never follow `<` with a letter.** MDX reads it as the start of a JSX tag and the build
  fails — `p<0.01` did exactly that. Escape it as `&lt;`, use the full-width `＜`, or write
  it out in words. Avoid bare `{` and `}` for the same reason.
- **Lucide props are kebab-case** — `stroke-width`. camelCase is emitted as an invalid
  attribute and silently does nothing.
- **`Checklist` `id`s must be unique across the whole book.** They become localStorage keys.
- **Do not hand-write the appendices.** `src/lib/extract.ts` generates the glossary,
  disputed-topics list, and source list from the `<Term>`, `<Disputed>`, and footnote
  markup in the chapters. Maintaining both by hand guarantees they drift apart.
- **Route internal links through `withBase()`.** On a GitHub Pages project site everything
  is served under `/<repo>/`, so an absolute `href="/legend"` breaks.

## Development workflow

Linting and formatting are oxc (oxlint / oxfmt). CI runs locally through lefthook git
hooks rather than GitHub Actions.

```bash
pnpm lint            # oxlint
pnpm lint:fix        # oxlint --fix
pnpm format          # oxfmt (rewrites files)
pnpm format:check    # oxfmt --check
pnpm typecheck       # astro check
pnpm check           # manuscript health check
pnpm build           # build only
pnpm preview         # astro preview
```

`pnpm check` (`scripts/check.mjs`) looks at four things:

1. **Readability** — mean sentence length, kanji ratio, chapter length
2. **MDX traps** — components and Markdown syntax that leaked into `items`
3. **Footnotes** — every `[^1]` reference has a definition
4. **Cross-reference drift** — "第N章 (label)" matching the chapter it actually points to

All four are things that have gone wrong for real. They are checks because reviewing them
by hand does not catch them.

Two further checks read the build output, so run them after `pnpm build`:

```bash
node scripts/check-seo.mjs     # sitemap / robots / llms.txt / JSON-LD / head
node scripts/a11y-audit.mjs    # heading order, landmarks, tables, duplicate ids, lang
```

`a11y-audit.mjs` sweeps all 35 pages. Because the body text is MDX, skipped heading levels
and duplicate `h1`s do happen in practice — that is how the three `h1`s in `18-biting.mdx`
were found.

### What lefthook runs, and when

`pnpm install` installs the hooks (`prepare` calls `lefthook install`).

| When | What | Scope |
|---|---|---|
| pre-commit | `oxfmt` | staged `.ts` `.mts` `.cts` `.js` `.mjs` `.cjs` |
| pre-commit | `oxlint --fix` | the above plus `.astro` |
| pre-commit | `pnpm check` | only when `.mdx` changed. **Does not block the commit** |
| pre-push | `astro check` → `oxlint` (whole repo) → `astro build` | whole repo |

- pre-commit is `parallel: false` on purpose: `oxfmt` and `oxlint --fix` rewrite the same
  files, and running them together makes the writes race.
- `.astro` is excluded from `oxfmt` because oxfmt cannot handle it (pass one explicitly and
  it exits 2). `.mdx`, `.md`, `.css`, and `.json` are excluded in `.oxfmtrc.json` so the
  manuscript formatting and the hand-aligned columns in `global.css` survive.
- `pnpm check` is wrapped in `|| true` deliberately. Some chapters still miss the
  readability targets and the cross-reference check has known false positives, so gating on
  it today would block every commit. Once the manuscript settles, dropping `|| true` turns
  it into a real gate.
- Type checking and the build sit in pre-push, because building 29 chapters takes around
  10 seconds.

Skipping hooks:

```bash
LEFTHOOK=0 git commit -m "wip"              # disable lefthook entirely
git commit --no-verify -m "wip"             # skip hooks on the git side
LEFTHOOK_EXCLUDE=lint git commit -m "wip"   # skip one job by name
```

Running them by hand, or reinstalling them:

```bash
pnpm exec lefthook run pre-commit --all-files
pnpm exec lefthook validate
pnpm run prepare    # reinstall the hooks
```

Per-machine overrides go in `lefthook-local.yml`, which is gitignored.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes to GitHub
Pages. It can also be run by hand from the Actions tab (`workflow_dispatch`). The job is
just `pnpm install --frozen-lockfile` and `pnpm run build`; linting and tests are not part
of it — that is lefthook's job.

**The repository name appears nowhere in the workflow or the code.**
`actions/configure-pages` reports the deployment target at run time (`origin` and
`base_path`); those are passed to the build as `SITE` and `BASE`, and `astro.config.mjs`
reads them:

```js
const site = process.env.SITE || 'http://localhost:4321';
const base = process.env.BASE || '/';
```

So the same configuration works for a user site (`<user>.github.io`, no base path) and for
a project site (base `/<repo>`). Locally the variables are unset, so it falls back to
`http://localhost:4321` and `/`.

Deployments are serialised with `concurrency: group: pages`. A running deployment is never
cancelled — interrupting one would publish a half-written site — but queued deployments
collapse to the newest.

One-time setup: in the repository's Settings → Pages, set Source to GitHub Actions.

## Licence

Code and prose are licensed separately.

| What | Licence |
|---|---|
| Code (`src/components`, `src/layouts`, `src/pages`, `src/lib`, `src/styles`, `scripts`, config files) | MIT — [`LICENSE`](LICENSE) |
| Prose (`src/content/**` and `docs/**`) | CC BY-NC-SA 4.0 — [`LICENSE-CONTENT`](LICENSE-CONTENT) |

You may copy, redistribute, adapt, and translate the prose as long as you credit it (title
`Wanvidence`, author `dashubei`, and a link back), **but not for commercial purposes**, and
any adaptation you distribute must carry the same CC BY-NC-SA 4.0 licence.

Rights in the quoted papers, statistics, statutes, and personal accounts remain with their
holders. The CC grant covers only the author's own expression — the structure, the writing,
the summaries, and the annotations.

## Contributing

This book was written for one specific reader who is about to get their first dog. There
is no plan to grow it into a general-purpose pet site. Within that, these are welcome:

- **Factual errors** (issue). Say which sentence in which chapter, and include **a URL or
  DOI for a primary source**. **A correction without a source cannot be taken, however
  plausible it looks** — that is the book's first rule, and it applies to contributions too.
- **Broken links, typos, build failures** (issue or PR).
- **Sourced additions and corrections** (PR). Follow
  `docs/decisions/02-style-guide.md` and `docs/decisions/11-plain-language-guide.md`. When
  an evidence badge is ambiguous, pick the weaker level.

Not accepted:

- Unsourced claims, generalisations drawn from anecdote, or "it is said that…" without
  saying who said it
- Rewrites that state something as settled when it is not
- Proposals to restructure the book or add chapters — the structure is fixed in
  `docs/decisions/01-structure.md`

Owner accounts are welcome, but they belong inside `<Experience>` and stop at "this is what
people report." No "you should" is derived from them.

This is a personal project; replies may take a while.
