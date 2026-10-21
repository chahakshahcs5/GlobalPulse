# The Block Studio

The Block Studio is a workbench for every block the platform can render. It
is to story blocks what Storybook is to components: pick a block type, pick a
variant, change the payload, and watch the result immediately.

```bash
pnpm dev:studio   # http://localhost:3003
```

## What it is for

A newsroom writes stories out of blocks. The questions that come up are always
the same ones:

- _What does this block actually look like with real data?_
- _We have three variants of the chart — which one reads best in the story?_
- _If the source attribution moves into the methodology note, does it still fit?_
- _Is this payload even valid?_

The studio answers all four. It renders the **real** block component — the same
one the published article uses — so a preview can never drift from what a
reader sees.

## The three panes

| Pane                  | What it does                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Catalog** (left)    | Every registered block type, grouped by the registry's own categories. Searchable, and each category collapses. |
| **Preview** (centre)  | The block, rendered live. Light or dark, at mobile, tablet or full width.                                       |
| **Inspector** (right) | The payload: a form generated from the block's schema, or the raw JSON.                                         |

Both side panels collapse from their own headers, so the preview can have the
whole screen. The studio's own light/dark theme and the preview's light/dark
theme are separate, and both are remembered between visits — you can work in
a dark studio while previewing a light article.

## Variants

A _variant_ is a named, ready-made payload for a block type — the way a chart
has a "line" variant and a "stacked bar" variant, or a callout has "info",
"warning", "tip" and "critical" variants. Switching variants swaps the whole
payload at once, which makes it easy to compare treatments side by side.

Variants live in `libs/block-studio/src/samples.ts` and are deliberately
realistic. A chart that says "cases" and "year" tells an editor far more about
how a block reads in a story than "Category 1 / 42" does.

## The generated form

The inspector's **Form** tab is not hand-written. It is generated from the
block's own Zod schema, so:

- it can never describe a shape the platform would reject;
- it stays in step with the schema automatically when the schema changes;
- a new block type gets an editable form without any studio work at all.

The **JSON** tab is the escape hatch — for a long list, or a payload pasted in
from somewhere else. Both tabs write to the same payload, and the preview
updates as you type.

Every field is checked against the block's schema as you edit, and the errors
are shown next to the field that caused them, with the path that failed. The
**Defaults** button fills in the schema's declared defaults for any field the
payload leaves unset, so an editor never has to guess what the platform would
do with a blank field.

## Every field has to do something

A field the schema declares but the renderer ignores is a field an editor can
change and see no effect — a promise the platform makes and does not keep.
The Block Studio makes that visible, and an audit keeps it from coming back:

```bash
pnpm audit:fields
```

The audit compares each block's schema against the source of the component
that renders it, and reports any field that is never read. It understands
destructuring (`const { level, text } = block.data`) and the programmatic
renderers in `@ai-news/media`, so `chart.legend` counts as used only when
`chartData.legend` is actually read — not when the file merely contains the
word "legend".

## Adding a block type to the studio

When you add a new block type to the platform, add a sample for it:

1. **`libs/schemas/src/blocks.ts`** — the Zod schema and the union entry.
2. **`libs/schemas/src/block-registry.ts`** — a `define(...)` entry.
3. **`libs/blocks-ui/src/blocks/BlockItem.tsx`** — a `case` and a view component.
4. **`libs/block-studio/src/samples.ts`** — a sample payload, and any variants.

Step 4 is the only one specific to the studio, and a block type with no
sample still appears in the catalog with an empty payload.

`tests/unit/blocks/block-studio-samples.test.ts` checks that every sample
validates against its schema and that the generated form reaches every part
of the payload, so a sample cannot quietly drift away from its block.## How it is put together

```text
libs/blocks-ui/       The shared renderers. The web app and the studio both
                      render blocks through this package, which is what makes
                      a preview trustworthy.
libs/block-studio/    The engine: the catalog, the variants, the Zod → form
                      converter, and the validator. Framework-agnostic.
apps/block-studio/    The studio UI.
```

Two details are worth knowing if you change this area.

**The block renderers do not talk to the API directly.** They take a runtime
through `BlockRuntimeProvider`. The web app supplies its real API client; the
studio supplies nothing, so live blocks fall back to the snapshot in their
payload — which is exactly what a preview should do.

**The studio chrome and the preview have separate themes.** The chrome uses
its own `studio-dark` variant, not the `dark` variant the block renderers
use. If the chrome used `dark`, a light preview nested inside it would still
pick up the blocks' dark styles. Keeping them apart is what allows a light
preview inside a dark studio, and a dark preview inside a light one.
