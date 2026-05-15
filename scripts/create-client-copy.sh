#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: bash scripts/create-client-copy.sh ../Client_Store_Name"
  exit 1
fi

if [[ -e "$TARGET" ]]; then
  echo "Target already exists: $TARGET"
  exit 1
fi

mkdir -p "$TARGET"

rsync -a \
  --exclude ".git" \
  --exclude ".codex" \
  --exclude ".env" \
  --exclude ".env.local" \
  --exclude ".env.development" \
  --exclude ".env.production" \
  --exclude "node_modules" \
  --exclude "dist" \
  --exclude ".DS_Store" \
  --exclude "*.log" \
  ./ "$TARGET"/

echo "Created client copy at: $TARGET"
echo "Next:"
echo "  cd $TARGET"
echo "  npm install"
echo "  npm run build"
