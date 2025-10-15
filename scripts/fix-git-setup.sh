#!/usr/bin/env bash
# Ejecutar desde la raíz del repo: bash scripts/fix-git-setup.sh [ORIGIN_URL]
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# 1) Configurar identidad local (modificá los valores o pasalos con env vars)
git config --local user.email "${GIT_USER_EMAIL:-you@example.com}"
git config --local user.name "${GIT_USER_NAME:-Your Name}"

# 2) Evitar warning CRLF -> LF al tocar archivos
git config --local core.autocrlf true

# 3) (Opcional) Añadir origin remoto si se pasa como parámetro y no existe
ORIGIN_URL="$1"
if ! git remote | grep -q '^origin$'; then
  if [ -n "$ORIGIN_URL" ]; then
    echo "Añadiendo remote origin -> $ORIGIN_URL"
    git remote add origin "$ORIGIN_URL"
  else
    echo "No existe remote 'origin'. Pasa la URL como primer parámetro para añadirla."
  fi
fi

# 4) Intentar fetch del remoto (si existe)
if git remote | grep -q '^origin$'; then
  echo "Haciendo git fetch origin..."
  git fetch origin --prune || true
fi

# 5) Asegurar que existe la rama 'main' local y asociarla al remoto si es posible
if git show-ref --verify --quiet refs/heads/main; then
  echo "Rama 'main' existe localmente."
  if git show-ref --verify --quiet refs/remotes/origin/main; then
    git branch --set-upstream-to=origin/main main || true
  fi
else
  if git show-ref --verify --quiet refs/remotes/origin/main; then
    echo "Creando rama main local desde origin/main"
    git checkout -b main origin/main
  else
    echo "No existe origin/main. Creando rama main local vacía."
    git checkout -b main
    if git remote | grep -q '^origin$'; then
      echo "Intentando push para crear origin/main (puede pedir credenciales)..."
      git push -u origin main || echo "Push falló: revisá permisos/remote."
    fi
  fi
fi

echo "Configuración git local aplicada. Verificá con: git config --local --list"
