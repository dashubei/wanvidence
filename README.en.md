[日本語](README.md)

# 🐕 Wanvidence

Twenty-nine chapters on living with a dog, with no claim left unsourced.

**https://dashubei.github.io/wanvidence/**

## What this is

A reference for people about to live with a dog for the first time.
It puts what research has established next to what owners actually report, and never lets
the two blur together. Every claim says how strong the evidence behind it is.

Twenty-nine chapters in eight parts, roughly 470,000 characters.
**The prose is in Japanese only.** The site has full-text search.

The book does not open with canine biology. It opens with "can you even do this," because
the chapters follow the order in which a prospective owner has to make decisions.
Every chapter has three layers. Someone in a hurry can read the conclusions at the top and
act on them. The standard reader reads the body text. The study itself — the numbers, the
sample sizes, and its limitations — sits inside a collapsed section.

Evidence strength appears as a badge right after the claim, on five levels: strong,
moderate, weak, personal account, and disputed.

The book holds to five rules.

1. **No claim without a source we could verify.**
   Where the research came up empty, the book says so in the body rather than dropping the
   topic
2. **Experience and evidence are visually separated.**
   Owner accounts live inside `<Experience>` blocks and are never dissolved into the body
   text
3. **Where there is a real dispute, the book says there is a dispute.**
   `<Disputed>` puts common Japanese practice and international veterinary-association
   guidance side by side
4. **Every risk is stated next to what to do about it.**
   Risk on its own makes people avoid the subject rather than change what they do
5. **No sentence ends with "this is important."**
   Claims are pushed down to a number, a procedure, a duration, or a failure mode

Technical terms are never simplified away. Each is glossed in everyday words on first use,
because knowing the correct word is itself useful when you are talking to a vet.

Three appendices — disputed topics, glossary, and sources — are generated from the chapter
text rather than maintained by hand.

## Who it is for

**Someone living in Japan who is about to get their first dog.**
Much of the book assumes Japanese law, Japanese administrative procedure, and the practices
of the Japanese pet industry. Those premises do not transfer to other countries.

It is not an exhaustive breed encyclopedia; the ~350 FCI-recognised breeds are out of scope.
It is not a diagnosis or treatment manual either.
Even the emergency chapter goes no further than "here is when to phone the clinic."

The medical, veterinary, and legal content is material for a conversation with a vet, a
trainer, or a lawyer — not a substitute for their judgement.
**Do not use this book to decide what to do about a dog that is symptomatic right now.**

## Built with

- **Astro 7** — static site generation; the output is plain static HTML
- **MDX** — the chapter format, so the prose itself can use the book's own components
  (`<KeyPoints>`, `<Deep>`, `<Disputed>`, `<Experience>`, `<EvidenceBadge>`, `<Term>`)
- **Tailwind CSS v4** — styling
- **Pagefind** — full-text search, indexed at build time. No server needed, and it handles
  Japanese. Only the search page loads any JavaScript for it
- **pnpm** — package manager
- **oxlint / oxfmt** (oxc) — linting and formatting
- **lefthook** — git hooks; CI runs locally rather than in GitHub Actions
- **GitHub Actions → GitHub Pages** — pushing to `main` deploys the site (CD only)

No JavaScript bundles ship: there is not a single `.js` file in `dist/_astro`. Only the
theme toggle and the checklists are small inline scripts. Building all 29 chapters
(35 pages) takes about 8 seconds, or roughly 11 with the search index.

## Licence

Code is MIT ([`LICENSE`](LICENSE)).
The prose is CC BY-NC-SA 4.0 ([`LICENSE-CONTENT`](LICENSE-CONTENT)): you may copy, adapt,
and translate it with credit, but not for commercial purposes.

## Development

Setup, writing rules, and how deployment works are in
[`docs/development.md`](docs/development.md) — **the detailed development docs are in
Japanese only.**
