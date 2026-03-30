#!/usr/bin/env bash
# Cursor hook: afterFileEdit — consome JSON no stdin; exit 0 (fail-open).
# Para pós-processamento pesado (lint em todo o repo), prefira CI ou tarefa manual.
# Para ativar Ruff só quando existir toolchain: descomente o bloco abaixo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cat >/dev/null

# if command -v ruff >/dev/null 2>&1 && [[ -f "$ROOT/pyproject.toml" || -f "$ROOT/ruff.toml" ]]; then
#   (cd "$ROOT" && ruff check . --fix 2>/dev/null) || true
# fi

exit 0
