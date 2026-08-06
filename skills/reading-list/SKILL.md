---
name: reading-list
description: Append a doc, spec, RFC, or blog post to the user's reading list at ~/.claude/reading-list.yaml. Use whenever you recommend something for them to read later, cite a doc page they have not opened, or they say "add that to my reading list". Also use to check whether a link is already on the list before recommending it.
license: MIT
metadata:
  hermes:
    tags: [Reading List, YAML, Productivity]
    category: productivity
---

# reading-list

The user's reading list lives at `~/.claude/reading-list.yaml`. A desktop app reads
that file, so the schema below is a contract — keep to it exactly.

## Schema

```yaml
unread:
  - link: https://microservices.io/patterns/communication-style/idempotent-consumer.html
    tags: [messaging, idempotency]
    context: why at-least-once delivery forces the consumer to dedupe, and where to record what it processed
    reasons:
      - the sync worker double-charged on a redelivered event and you wanted the standard fix
read:
  - link: https://docs.nestjs.com/recipes/cqrs
    tags: [nestjs, cqrs]
    context: when CommandBus and CommandHandler earn their keep versus a plain service
    reasons:
      - deciding whether the ingest module needed a command bus at all
      - came up again while splitting the oversized upload handler
    readAt: 2026-07-30
```

Two top-level keys, both always present, both lists.

| Field     | Where       | Rule                                                                                                                                        |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `link`    | both        | The exact URL you fetched. Never a URL from memory.                                                                                         |
| `tags`    | both        | A list of one to three short lowercase slugs: `messaging`, `nestjs`, `azure`, `sql`. Reuse existing tags when they fit — the app colour-codes by tag. |
| `context` | both        | One line about the **doc**: what it *answers*, not what it *is*. Lowercase start, no trailing period. Written once and left alone.           |
| `reasons` | both        | A list. One line per time it landed on the list: what **the user** was doing or asking when it came up. Lowercase start, no trailing period. |
| `readAt`  | `read` only | `YYYY-MM-DD`. The app writes this; you never add it.                                                                                        |

`context` describes the document. `reasons` describes the user's situation. Both
are for a future reader who has forgotten the conversation entirely.

## Adding a link

1. Read `~/.claude/reading-list.yaml`. If it does not exist, create it with both
   keys present and `unread` holding your first entry.
2. Check the URL against **both** `unread` and `read`.
   - **Not there** → insert a new entry at the **top** of `unread` with `tags`,
     `context`, and one `reasons` line. The app shows newest first.
   - **Already there** → do not add a second entry. Merge into the existing one
     instead, wherever it sits (see below).
3. Leave the `read` list ordering untouched. Never reorder it, never delete from it.

## Merging into a link that is already listed

Edit the existing entry in place. Do not move it, do not re-date it, do not
promote it to the top of `unread`.

- **`tags`** — append any tag that is genuinely new. Keep the existing order.
  Never remove a tag. Cap the entry at four tags; past that, only add one if it
  is more useful than one already there, and say what you swapped.
- **`reasons`** — append one line for this new occasion, at the end of the list.
  Skip it only if an existing reason already says the same thing; near-duplicates
  are noise. A second reason is what makes the entry worth keeping — resist the
  urge to skip.
- **`context`** — leave it alone. Only touch it if it is missing or plainly wrong
  about what the doc says.
- **`readAt`** — never add, change, or remove it. An already-read link that comes
  up again stays in `read` with a new reason appended.

## Hard rules

- **Only links you have actually fetched this session.** If you have not
  fetched it, you do not know the URL resolves or what it says. Fetch first.
- **Never write `readAt`.** Marking things read is the app's job.
- **Do not move items between lists.** Only the app does that.
- **`reasons` is never empty.** An entry with no reason is an entry the user
  cannot act on later.

## Good and bad lines

`context` — about the doc:

| Bad                  | Good                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| the NestJS CQRS docs | when CommandBus and CommandHandler earn their keep versus a plain service |
| about Event Hubs     | which Kafka features Event Hubs does not support, and how the terms map  |
| useful for the sync work | which REST calls mean a block blob is fully committed                |

`reasons` — about the user:

| Bad                   | Good                                                                    |
| --------------------- | ----------------------------------------------------------------------- |
| you asked for it      | chasing a duplicate charge after a redelivered event in the sync worker  |
| relevant background   | you wanted the bytes to skip the API server on large uploads             |
| came up in discussion | picking between tus and direct-to-storage for the upload rewrite         |

## Telling the user

One line, after the write.

New entry — name the tags and the unread count:

> Added to your reading list (messaging, idempotency) — 8 unread.

Already listed — say which list, and what you merged:

> Already on your read list — added a reason and the `idempotency` tag.
