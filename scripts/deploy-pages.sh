#!/usr/bin/env bash
# Build for GitHub Pages (served at /tinylog/) and push dist to the gh-pages branch.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_URL=$(git remote get-url origin)
BASE_PATH=/tinylog/ npm run build
tmp=$(mktemp -d)
cp -R dist/. "$tmp"
touch "$tmp/.nojekyll"
cp "$tmp/index.html" "$tmp/404.html"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="deploy" -c user.email="deploy@local" commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "$REPO_URL" gh-pages
rm -rf "$tmp"
echo "Pushed gh-pages"
