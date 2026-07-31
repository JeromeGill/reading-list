# Development

Building from source. If you only want to *use* Reading List, the [README](../README.md) install is shorter — no Rust, no clone.

## Prerequisites

| Need      | Check             | Get it                                                            |
| --------- | ----------------- | ----------------------------------------------------------------- |
| Node      | `node -v`         | v20+ (built and tested on v25)                                    |
| pnpm      | `pnpm -v`         | `npm i -g pnpm` (v10+)                                            |
| Rust      | `cargo --version` | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLT | `xcode-select -p` | `xcode-select --install`                                          |

If `cargo` is not found after installing Rust, it is at `~/.cargo/bin`. Add it to your shell:

```sh
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

## Build and install

```sh
git clone git@github.com:JeromeGill/reading-list.git
cd reading-list
./install.sh
```

`install.sh` runs `pnpm install`, builds, copies `Reading List.app` to `/Applications`, and symlinks `skills/reading-list` into `~/.claude/skills/`. It overwrites both if they already exist. First Rust build takes 3–5 minutes; later ones ~20s.

The skill is a symlink, not a copy, so editing `skills/reading-list/SKILL.md` in the checkout takes effect immediately — Claude Code follows the symlink and watches the directory for changes. No reinstall, no restart, unless `~/.claude/skills/` did not exist when the session started.

To link the skill without building the app:

```sh
ln -s "$PWD/skills/reading-list" ~/.claude/skills/reading-list
```

A skill installed this way is invoked as `/reading-list`. Installed as a plugin instead (the README route) it is namespaced `/reading-list:reading-list`. Don't do both — pick one, or the same skill loads under two names.

## Day to day

```sh
pnpm tauri dev      # hot-reloading dev window
pnpm build          # typecheck + build the frontend only
pnpm tauri build    # .app and .dmg for this machine's architecture
```

`pnpm tauri dev` reads and writes your real `~/.claude/reading-list.yaml`. Back it up first if you are changing the write path.

## Cutting a release

```sh
rustup target add x86_64-apple-darwin aarch64-apple-darwin   # once
pnpm tauri build --target universal-apple-darwin
```

The DMG lands in `src-tauri/target/universal-apple-darwin/release/bundle/dmg/`.

If `bundle_dmg.sh` fails, a disk image from a previous failed run is probably still mounted. Check `ls /Volumes` for a `dmg.*` entry, then:

```sh
hdiutil detach /Volumes/dmg.XXXXXX -force
rm -f src-tauri/target/**/bundle/macos/rw.*.dmg
```

The app is unsigned, so every release needs the right-click → Open dance on first launch. That is a note for the release description, not a bug.
