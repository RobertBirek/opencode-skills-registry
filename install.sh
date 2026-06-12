#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
SKILLS_REGISTRY="$CONFIG_DIR/skills-registry"
SKILLS_DIR="$CONFIG_DIR/skills"
COMMANDS_DIR="$CONFIG_DIR/commands"

echo "==> Installing opencode-skills-registry to $CONFIG_DIR"

mkdir -p "$SKILLS_REGISTRY" "$SKILLS_DIR" "$COMMANDS_DIR"

# Registry (overwrite)
cp -r "$REPO_DIR/registry/"* "$SKILLS_REGISTRY/"

# Skills (merge — don't overwrite custom skills)
for src in "$REPO_DIR/skills/"*/; do
  name="$(basename "$src")"
  if [ -d "$SKILLS_DIR/$name" ]; then
    echo "  skill '$name' exists, skipping"
  else
    cp -r "$src" "$SKILLS_DIR/$name"
    echo "  + skill $name"
  fi
done

# Commands (merge — don't overwrite custom commands)
for src in "$REPO_DIR/commands/"*.md; do
  name="$(basename "$src")"
  if [ -f "$COMMANDS_DIR/$name" ]; then
    echo "  command '$name' exists, skipping"
  else
    cp "$src" "$COMMANDS_DIR/$name"
    echo "  + command $name"
  fi
done

# Upstream vault
echo "==> Syncing FrancoStino upstream vault..."
node "$SKILLS_REGISTRY/scripts/sync-francostino-upstream.mjs"

echo ""
echo "=== Done ==="
echo "Restart opencode, then run /init-skills inside a project to auto-select skills for its stack."
