# How it fits together

Two halves that never talk to each other. They share one file.

```
Claude (any project) ──writes──▶ ~/.claude/reading-list.yaml ◀──reads/writes── Reading List.app
        via the reading-list skill
```

- **The skill** — `skills/reading-list/SKILL.md`. Instructions Claude Code loads when it recommends something worth reading. It prepends an entry to `unread` and stops there.
- **The app** — a Tauri app. It renders `unread`, opens links in your browser, and moves an entry to `read` when you click `×`.

There is no daemon, no IPC, no server. The app re-reads the file whenever its window regains focus, which is why links added while it is open appear when you tab back to it.

## The contract

Both halves depend on this shape, so changing it means changing both.

```yaml
unread:
  - link: https://microservices.io/patterns/communication-style/idempotent-consumer.html
    topic: messaging
    context: why at-least-once delivery forces the consumer to dedupe, and the two places to record what it has processed
read:
  - link: https://docs.nestjs.com/recipes/cqrs
    topic: nestjs
    context: when CommandBus and CommandHandler earn their keep versus a plain service
    readAt: 2026-07-30
```

| Field     | Where       | Meaning                                                     |
| --------- | ----------- | ----------------------------------------------------------- |
| `link`    | both        | The URL. Claude only ever adds URLs it actually fetched.     |
| `topic`   | both        | Short lowercase slug. The app colour-codes badges by topic.  |
| `context` | both        | One line on what the doc *answers*.                          |
| `readAt`  | `read` only | `YYYY-MM-DD`, written by the app when you click `×`.         |

Both top-level keys are always present. Ownership is split so the two halves cannot fight:

- The skill only prepends to `unread`. It never writes `readAt`, never reorders, never moves an entry between lists.
- The app owns everything else, including the transition from `unread` to `read`.

## Two ways the skill gets installed

| Route | Lands at | Invoked as |
| --- | --- | --- |
| Plugin (`/plugin install`) | `~/.claude/plugins/cache` | `/reading-list:reading-list` |
| `install.sh` or manual `ln -s` | symlink at `~/.claude/skills/reading-list` | `/reading-list` |

The plugin route works without a checkout, so it is what the README recommends. The symlink route makes the checkout live-editable, so it is what you want while developing. Installing both loads the same skill twice under two names.

`.claude-plugin/marketplace.json` sets `"source": "./"`, meaning the repo root *is* the plugin, and Claude Code scans the existing `skills/` folder. That is why there is no second copy of `SKILL.md` to keep in sync — at the cost of the plugin cache holding the whole repo, app source included.

## Layout

```
src/
  App.tsx            UI — list, topic badges, open, mark read
  reading-list.ts    schema types, YAML load/save, list transitions
src-tauri/
  src/lib.rs         Tauri entry; registers the fs and opener plugins
  capabilities/      fs access is scoped to $HOME/.claude/reading-list.yaml only
  tauri.conf.json    window and bundle config
skills/
  reading-list/      the Claude Code skill; the canonical copy
.claude-plugin/      plugin + marketplace manifests, so the repo installs via /plugin
docs/                these docs
install.sh           builds, installs the app, links the skill
```

The Tauri capability in `src-tauri/capabilities/` scopes filesystem access to that one YAML path. The app cannot read anything else in `~/.claude/`, which is worth preserving if you touch the fs plugin config.
