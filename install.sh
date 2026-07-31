#!/usr/bin/env bash
# Builds the app, installs it to /Applications, and installs the reading-list
# skill to ~/.claude/skills/. Overwrites both if they already exist.
set -euo pipefail

cd "$(dirname "$0")"

APP="Reading List.app"
BUNDLE="src-tauri/target/release/bundle/macos/$APP"
SKILL_DEST="$HOME/.claude/skills/reading-list"

# rustup installs here but does not put it on the shell PATH by default.
export PATH="$HOME/.cargo/bin:$PATH"

command -v cargo >/dev/null || {
  echo "cargo not found. Install Rust: https://rustup.rs" >&2
  exit 1
}

echo "==> Building"
pnpm install
pnpm tauri build

echo "==> Installing $APP to /Applications"
rm -rf "/Applications/$APP"
cp -R "$BUNDLE" /Applications/

echo "==> Installing skill to $SKILL_DEST"
mkdir -p "$(dirname "$SKILL_DEST")"
rm -rf "$SKILL_DEST"
cp -R skills/reading-list "$SKILL_DEST"

echo
echo "Done."
echo "The app is unsigned, so the first launch needs: right-click the app in"
echo "/Applications -> Open -> Open. After that it opens normally."
