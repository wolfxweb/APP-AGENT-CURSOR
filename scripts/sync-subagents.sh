#!/usr/bin/env bash
# Replica subagentes de .cursor/agents (fonte) para .claude/agents e .codex/agents.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/.cursor/agents"
for dest in "$ROOT/.claude/agents" "$ROOT/.codex/agents"; do
  mkdir -p "$dest"
  rm -f "$dest"/*.md
  cp "$SRC"/*.md "$dest/"
done
echo "Subagents synced: .claude/agents and .codex/agents"
