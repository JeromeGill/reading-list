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
    topic: messaging
    context: why at-least-once delivery forces the consumer to dedupe, and where to record what it processed
read:
  - link: https://docs.nestjs.com/recipes/cqrs
    topic: nestjs
    context: when CommandBus and CommandHandler earn their keep versus a plain service
    readAt: 2026-07-30
```

Two top-level keys, both always present, both lists.

| Field     | Where            | Rule                                                                   |
| --------- | ---------------- | ---------------------------------------------------------------------- |
| `link`    | both             | The exact URL you fetched. Never a URL from memory.                    |
| `topic`   | both             | One short lowercase word or slug: `messaging`, `nestjs`, `azure`, `sql`. Reuse an existing topic when one fits — the app colour-codes by topic. |
| `context` | both             | One line, lowercase start, no trailing period. Say what the doc *answers*, not what it *is*. |
| `readAt`  | `read` only      | `YYYY-MM-DD`. The app writes this; you never add it.                   |

## Adding a link

1. Read `~/.claude/reading-list.yaml`. If it does not exist, create it with both
   keys present and `unread` holding your first entry.
2. Check the URL against **both** `unread` and `read`. If it is already there,
   do not add it again — tell the user it is already on the list, and say which
   list it is on.
3. Insert the new entry at the **top** of `unread`. The app shows newest first.
4. Leave the `read` list untouched. Never reorder it, never delete from it.

## Hard rules

- **Only links you have actually fetched this session.** If you have not
  fetched it, you do not know the URL resolves or what it says. Fetch first.
- **One line of context, written for a future reader who has forgotten the
  conversation.** "how X works" is useless. "why at-least-once delivery forces
  the consumer to dedupe" is useful.
- **Never write `readAt`.** Marking things read is the app's job.
- **Do not move items between lists.** Only the app does that.

## Good and bad context lines

| Bad                              | Good                                                                     |
| -------------------------------- | ------------------------------------------------------------------------ |
| the NestJS CQRS docs             | when CommandBus and CommandHandler earn their keep versus a plain service |
| about Event Hubs                 | which Kafka features Event Hubs does not support, and how the terms map    |
| useful for the sync work         | which REST calls mean a block blob is fully committed                     |

## Telling the user

One line, after the write. Name the topic and the count:

> Added to your reading list (messaging) — 8 unread.
