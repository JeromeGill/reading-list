# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm tauri dev      # hot-reloading dev window (frontend on :1420)
pnpm build          # tsc typecheck + vite build, frontend only — the fastest correctness check
pnpm tauri build    # .app and .dmg for this machine's architecture
./install.sh        # full build, copy app to /Applications, symlink the skill into ~/.claude/skills/
```

There is no test suite and no linter configured. `pnpm build` (which runs `tsc`) is the only
automated check; run it after touching anything under `src/`.

`pnpm tauri dev` reads and writes the **real** `~/.claude/reading-list.yaml`. Back it up before
changing anything on the write path.

Releases are universal binaries and require the targets once:
`rustup target add x86_64-apple-darwin aarch64-apple-darwin`, then
`pnpm tauri build --target universal-apple-darwin`. Version lives in **two** places that must
match: `package.json` and `src-tauri/tauri.conf.json`.

## Architecture

Two halves that never talk to each other. They share one file on disk.

```
Claude (any project) ──writes──▶ ~/.claude/reading-list.yaml ◀──reads/writes── Reading List.app
     via skills/reading-list/SKILL.md                              src/ + src-tauri/
```

No daemon, no IPC, no server, no network. The app re-reads the file on `window` focus
(`src/App.tsx`) precisely because Claude edits it from other projects while the window is open.

### The YAML schema is a cross-boundary contract

`unread` and `read` lists of `{ link, tags, context, reasons }`, plus `readAt` on read entries.
It is written down in **four** places, and changing the shape means changing all of them:

- `src/reading-list.ts` — the TypeScript types and load/save
- `skills/reading-list/SKILL.md` — what Claude is told to write
- `docs/architecture.md` and `README.md` — the documented contract

### Ownership split

This is what keeps the two halves from fighting, and it is easy to break by accident:

- **The skill** only prepends to `unread`, or merges `tags`/`reasons` into an existing entry
  **in place**. It never writes `readAt`, never reorders, never moves entries between lists.
- **The app** owns everything else, including the `unread` → `read` transition and `readAt`
  (`markRead` / `markUnread` in `src/reading-list.ts`).

### Filesystem access is scoped to one path

`src-tauri/capabilities/default.json` grants `fs:allow-exists`, `fs:allow-read-text-file`, and
`fs:allow-write-text-file` for `$HOME/.claude/reading-list.yaml` only — the app cannot read
anything else in `~/.claude/`. Any new file or URL the app touches needs a matching entry there
or it fails at runtime, not at build time. Keep the scope tight.

### Skill installation has two routes

`.claude-plugin/marketplace.json` sets `"source": "./"`, so the repo root *is* the plugin and
Claude Code scans the existing `skills/` folder. There is deliberately no second copy of
`SKILL.md`. Installed as a plugin the skill is `/reading-list:reading-list`; installed via
`install.sh` (a symlink into `~/.claude/skills/`) it is `/reading-list`. Installing both loads
the same skill twice under two names.

The symlink means edits to `skills/reading-list/SKILL.md` in the checkout take effect
immediately — no reinstall, no restart.

## Conventions

- Styling is Tailwind v4 via `@tailwindcss/vite` — no `tailwind.config`; the single `@import
  "tailwindcss"` lives in `src/index.css`. Every component supports dark mode via `dark:`
  variants; keep both themes working.
- `src/App.tsx` is the whole UI, `src/reading-list.ts` is the whole data layer. Prefer keeping
  it that way over adding folders.
- The Rust side (`src-tauri/src/lib.rs`) is a bare Tauri builder registering the `fs` and
  `opener` plugins. There are no custom commands, and adding one should be a last resort.
