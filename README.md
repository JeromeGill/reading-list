# Reading List

A small desktop app for the pile of docs Claude tells you to read.

Two halves that share one file:

- **The skill** — a Claude Code skill. Whenever Claude recommends a doc, spec, or blog post in any project, it appends the link to `~/.claude/reading-list.yaml`.
- **The app** — a Tauri desktop app that shows the unread list. Click a link to open it in your browser, click `×` to move it to the read pile.

```
Claude (any project) ──writes──▶ ~/.claude/reading-list.yaml ◀──reads/writes── Reading List.app
        via the reading-list skill
```

The app re-reads the file whenever its window regains focus, so links added while it is open show up when you tab back to it.

## The file

`~/.claude/reading-list.yaml`

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

| Field     | Where       | Meaning                                                                  |
| --------- | ----------- | ------------------------------------------------------------------------ |
| `link`    | both        | The URL. Claude only ever adds URLs it actually fetched.                  |
| `topic`   | both        | Short lowercase slug. The app colour-codes badges by topic.               |
| `context` | both        | One line on what the doc *answers*.                                       |
| `readAt`  | `read` only | `YYYY-MM-DD`, written by the app when you click `×`.                      |

The app owns the two lists. The skill only ever prepends to `unread`.

## Install on a fresh machine

### 1. Prerequisites

| Need   | Check           | Get it                                                     |
| ------ | --------------- | ---------------------------------------------------------- |
| Node   | `node -v`       | v20+ (built and tested on v25)                             |
| pnpm   | `pnpm -v`       | `npm i -g pnpm` (v10+)                                     |
| Rust   | `cargo --version` | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLT | `xcode-select -p` | `xcode-select --install`                                |

If `cargo` is not found after installing Rust, it is at `~/.cargo/bin`. Add it to your shell:

```sh
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

### 2. Build and install both halves

```sh
git clone <this repo> readinglist
cd readinglist
./install.sh
```

`install.sh` does four things:

1. `pnpm install`
2. `pnpm tauri build` — first Rust build takes 3–5 minutes, later ones ~20s
3. Copies `Reading List.app` to `/Applications`
4. Copies `skills/reading-list` to `~/.claude/skills/reading-list`

It overwrites both if they already exist.

### 3. First launch

The app is unsigned, so macOS blocks the first open. Right-click it in `/Applications` → **Open** → **Open**. After that it opens normally, including from Spotlight.

### 4. Tell Claude to use the skill

A skill only fires when Claude judges it relevant. To make it reliable, add a pointer to `~/.claude/CLAUDE.md` so it is always in context:

```markdown
# Reading List

When you suggest a doc, spec, or blog post worth reading, invoke the
`reading-list` skill. It owns the file, the schema, and the dedupe rules.

- The list lives at `~/.claude/reading-list.yaml`. A desktop app reads and writes it, so don't hand-edit it — go through the skill.
- Only links you have actually fetched. Never write a URL from memory.
- Don't re-add a link already listed; say it's already there and which list it's on.
```

That is the whole integration. The skill itself carries the schema and the rules; `CLAUDE.md` just guarantees Claude remembers the skill exists.

### Installing the skill on its own

If you only want Claude writing the list on a machine without the app:

```sh
cp -R skills/reading-list ~/.claude/skills/reading-list
```

Then add the `CLAUDE.md` block above. The skill creates the YAML file if it is missing.

## Development

```sh
pnpm tauri dev      # hot-reloading dev window
pnpm build          # typecheck + build the frontend only
pnpm tauri build    # produce .app and .dmg in src-tauri/target/release/bundle/
```

`pnpm tauri dev` reads and writes your real `~/.claude/reading-list.yaml`. Back it up first if you are changing the write path.

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
  reading-list/      the Claude Code skill, installed to ~/.claude/skills/
install.sh           builds, installs the app and the skill
```
