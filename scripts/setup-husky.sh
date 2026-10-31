#!/bin/sh
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
npx husky add .husky/pre-push 'pnpm run lint && pnpm run typecheck'
