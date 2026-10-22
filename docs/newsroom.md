# The Newsroom

The newsroom is the CMS: the place a story is written, edited, and
published. It lives at `/admin` in the web portal, and it is the same
product as the Block Studio and the API — one session, one set of blocks,
one place the story is true.

```text
apps/web/src/app/admin/
  page.tsx                        The newsroom itself: the list and the metrics
  stories/new/page.tsx            A new story, on a page of its own
  stories/[id]/page.tsx           A story being edited, on a page of its own
  components/story-editor/        The editor, and the form that fills in a block
```

## The list of stories

The newsroom's stories are read a page at a time — ten at a time — from the
API, and the rest are fetched when the editor asks for them.

The counts are the API's counts. That matters more than it sounds: a
newsroom with 202 stories and a table showing the first ten has 202
stories, and the number in the corner has to say so. Counting the stories
that happened to be fetched answered a different question from the one the
number asks.

The same goes for the filters, the search and the order. **All**, **Review
Queue**, **Published**, **Scheduled** and **Drafts** are counted by the
API, narrowing the list is the API's work rather than the browser's, the
search looks through the titles and summaries on the server, and the order
— recently edited, newest, oldest, title, status — is the database's.

A newsroom of two hundred stories cannot be searched in the browser without
fetching all two hundred, and the counts would then be the counts of a page
rather than of the newsroom.

A refetch — the newsroom's event stream keeps the list fresh — keeps the
depth it had. It does not collapse the list back to its first page, so
**Load more** does not quietly undo itself.

## The editor

The composer edits the story's blocks. All of them, in the order they
read.

They are shown as a list. Each one is edited with the same schema-driven
form the Block Studio uses, so a block of any type the platform supports
can be added from the same catalog the studio shows, and the form can never
offer a field the platform would reject. Each one can be moved up or down,
removed, or opened in the Block Studio.

The editor used to keep a lead paragraph, three bullets and a list of media
blocks, and rebuild the story from them on save. Every block it did not
understand was dropped in the process, so opening somebody else's story
showed an almost empty article — and saving it destroyed the rest.

### A draft is written to the API as it is edited

The first block added to a story that does not exist yet creates it as a
draft, and from then on every change — a block added, a block changed, the
order changed, a block removed — is written straight through. The blocks are
no longer only in the browser until somebody remembers to press save.

A **published** story is not written live. Its blocks wait for the version
commit that publishes them, so a live story never changes without a record
of it.

### The editor, in a drawer and on a page

The newsroom's editor works in a drawer, which is right for a quick
change. Writing a story is not a quick change, so it also has a page of its
own:

- `/admin/stories/new` — a new story.
- `/admin/stories/[id]` — a story being edited.

Both use the same editor, so there is only one set of rules about what a
story is.

### How the story is saved

One choice and one action: the outcome — a draft, for review, scheduled,
published — is chosen, and then the story is saved. Four buttons that each
save the story differently is a lot to read and more to decide between, and
the one that gets pressed is the one that matters.

## The Block Studio, from the newsroom

The studio can be opened for the story being edited, for one of its
blocks, or for a new story with no id to write to. A block built there is
handed back to the composer through the browser and joins the draft, unless
the story already exists on the server — then the studio writes to it
directly, and the composer reads the story again when the editor comes
back.

## The metrics

The numbers in the corner are the newsroom's, counted by the database
rather than by counting a page of stories. They are gathered in a handful
of queries — counting the comments, the reactions, the versions and the
story intelligence one story at a time took half a minute — and they are
held for half a minute, because a picture of a newsroom taken a moment ago
is the same picture.
