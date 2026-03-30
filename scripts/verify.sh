#!/usr/bin/env bash
# Gate único: local + CI. Exit 0 = pode avançar; exit 1 = corrigir antes do próximo tópico.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== verify.sh (APP / appGetUp) ==="

ran=0
failed=0

run_pytest_in() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  [[ -d "$dir/tests" || -f "$dir/pyproject.toml" || -f "$dir/pytest.ini" ]] || return 0
  command -v pytest &>/dev/null || return 0
  echo "--- pytest ($dir) ---"
  (cd "$dir" && pytest -q) || failed=1
  ran=1
}

if [[ -f "pyproject.toml" || -f "pytest.ini" || -d "tests" ]]; then
  if command -v pytest &>/dev/null; then
    echo "--- pytest (raiz) ---"
    pytest -q || failed=1
    ran=1
  fi
fi

run_pytest_in "backend"
run_pytest_in "api"
run_pytest_in "app"

run_playwright_in() {
  local dir="$1"
  [[ -f "$dir/package.json" ]] || return 0
  grep -qE '@playwright/test|"playwright"' "$dir/package.json" 2>/dev/null || return 0
  echo "--- playwright test ($dir) ---"
  if command -v pnpm &>/dev/null; then
    (cd "$dir" && pnpm exec playwright test) || failed=1
  elif command -v npm &>/dev/null; then
    (cd "$dir" && npx playwright test) || failed=1
  else
    echo "ERRO: npm/pnpm não encontrado para Playwright em $dir"
    failed=1
  fi
  ran=1
}

run_playwright_in "."
run_playwright_in "frontend"
run_playwright_in "web"
run_playwright_in "client"

if [[ "$ran" -eq 0 ]]; then
  echo "Nenhuma suite detectada (pytest/playwright). Gate ignorado — adicione testes e configure caminhos em scripts/verify.sh."
  exit 0
fi

if [[ "$failed" -ne 0 ]]; then
  echo "=== VERIFY FALHOU — não avance para o próximo tópico até corrigir. ==="
  exit 1
fi

echo "=== VERIFY OK ==="
exit 0
