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

## Loading a real block, and saving it back

The studio is at its most useful when it is pointed at real content.
**From a story** searches the newsroom's stories through the API — a query
goes to the server rather than filtering a list the studio already has — and
pages through the results.

Picking a block loads its payload into the editor, so an editor can see how
a block that is already live actually reads, change it, and take the
corrected payload back to the story. **Save to story** offers two ways back:

- **Save as a new version** — the workflow-aware path. It snapshots an
  immutable version, records the change in the audit log with the change
  summary, and prepends a `what_changed` block so readers can see what
  moved. The story keeps its status and the new content goes live at once:
  the platform has no staged revision that waits for a publish, so a version
  commit _is_ both the audit record and the publish.
- **Update the block in place** — surgical and immediate, but it creates no
  version, no audit entry and no diff block. The story's version history
  will not mention the change.

## The session is the product's, not the studio's

The studio has no token field, no second sign-in and no account of its own.
It uses the same session as the newsroom portal, because the two are the
same product.

That session lives in a cookie the API sets, and it is `HttpOnly` — script
cannot read it, so nothing in the browser can steal it by reading a
variable. The studio asks the API who it is talking to (`GET /api/auth/me`)
and shows the answer in the header. Sign in on the portal and the studio is
already signed in; sign in in the studio and the portal is already signed
in.

The cookie is scoped to the host and not the port, which is what lets it
cross between the two apps in development. When they are deployed on sibling
hosts, set `COOKIE_DOMAIN` to the shared parent domain and the session
follows the editor between them.

Reading works without a session. Writing does not — the API refuses it, and
the studio says so rather than failing quietly.

The studio proxies the API through its own origin, so the browser never
talks to the API directly and no CORS setup is needed. Point it somewhere
with `apps/block-studio/.env`:

```bash
API_INTERNAL_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WEB_URL=http://localhost:3002
```

## The story the studio is working in

When the studio is opened from the newsroom CMS — or when a block is picked
from a story — the story itself appears at the top of the catalog, with its
status and the list of its blocks. Clicking a block in that list opens it
in the editor, and the arrows beside it move the block up or down in the
story. The order is the story's, so it is written to the API rather than
kept in the studio.

A block is not an isolated object; it is a piece of a story. The studio
shows where the editor is: which story, which of its blocks is open, and
what else the story contains. **Open the story in the portal** goes back to
the story itself.

A story that already exists is written to directly: **Add to story** adds
the block to it, and the API records an audit entry. The hand-back through
the browser is only for a story that is still being written and has no id
to write to.

## Saving a variant

**Save as variant** keeps the payload as it stands now, under a name of your
choosing. Saved variants live in your own browser, so a variant you are
working on does not become everyone's default; the samples in the repository
are untouched. A saved variant can be removed again from the variant bar.

## Seeing what you changed

A field you have edited is marked **edited**, so an editor can see at a
glance what they have touched since the block was loaded. The **Compare**
menu in the variant bar puts a second variant alongside the current one,
which is how two treatments of the same block are judged side by side.

The comparison splits into two columns when the canvas has room for them,
not when the window does. The window is mostly taken by the catalog and the
inspector, so a window-sized breakpoint would almost never fire and the
comparison would always stack. Each column is labelled with the variant it
shows.

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
of the payload, so a sample cannot quietly drift away from its block.

## How it is put together

```text
libs/blocks-ui/       The shared renderers. The web app and the studio both
                      render blocks through this package, which is what makes
                      a preview trustworthy.
libs/block-studio/    The engine: the catalog, the variants, the Zod → form
                      converter, the validator — and the editing components
                      themselves, so a host can reuse the form.
libs/api-client/      The one door to the newsroom API. The web portal, the
                      Block Studio and anything else that talks to the API go
                      through it, so they all speak the same dialect and
                      share the same session.
apps/block-studio/    The studio UI.
```

### The same form in the newsroom CMS

The composer in the newsroom CMS uses the same schema-driven form as the
studio. That is not a convenience — it is what stops the two from drifting
apart, and it is what stopped the composer from producing blocks the
platform would reject.

The composer used to keep a flattened, invented shape: a chart's axis as a
bare string, its rows as a text blob, a table's rows as one comma-separated
line. It rebuilt that shape on save, and the platform rejected the result.
A chart written in the CMS was not a chart the site could render.

Now the composer's blocks carry the payload their schema declares, the form
is generated from that same schema, and the composer's output is checked
against it before the story is saved. The schema is the single source of
truth for both.

### The composer edits the story, not a private arrangement of it

The composer used to keep a lead paragraph, three bullets and a list of
media blocks, and rebuild the story from them on save. Every block it did
not understand — a heading, a citation, a source, a timeline — was dropped
in the process. Opening somebody else's story in the CMS showed an almost
empty article, and saving it destroyed the rest.

The composer now holds the story's blocks, all of them, in the order they
read. They are shown as a list; each one is edited with the same
schema-driven form the studio uses; and each one can be moved up or down,
removed, or opened in the studio. A block of any type the platform supports
can be added, from the same catalog the studio shows.

A **draft** is written to the API as it is edited. The first block added to
a story that does not exist yet creates it as a draft, and from then on
every change — a block added, a block changed, the order changed, a block
removed — is written straight through. A **published** story is not: its
blocks wait for the version commit that publishes them, so a live story
never changes without a record of it.

### Two details worth knowing if you change this area

**The block renderers do not talk to the API directly.** They take a runtime
through `BlockRuntimeProvider`. The web app supplies its real API client; the
studio supplies nothing, so live blocks fall back to the snapshot in their
payload — which is exactly what a preview should do.

**The studio chrome and the preview have separate themes.** Both use the
`dark` variant, but the `dark` class is put on the chrome panels themselves
rather than on the document. If it were on the document, a light preview
nested inside a dark studio would still pick up the blocks' dark styles.
Keeping the class on the panels is what allows a light preview inside a
dark studio, and a dark preview inside a light one — and it is what lets
the same editing component be used by the newsroom CMS, where the app's own
`dark` class is already on the document.
