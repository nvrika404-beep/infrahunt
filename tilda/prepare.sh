#!/bin/bash
# Готовит сайт к выгрузке на Тильду: копия проекта с заменами под формы Тильды → сборка → CSS, скрипты, блоки.
set -euo pipefail
T=$(cd "$(dirname "$0")" && pwd); ROOT=$(dirname "$T"); SITE=$T/work/site
mkdir -p "$T/work"
rm -rf -- "$SITE" && mkdir -p "$SITE"
cp -r "$ROOT/astro.config.mjs" "$ROOT/package.json" "$ROOT/src" "$ROOT/public" "$SITE/"
cp -r "$T/overrides/." "$SITE/"
ln -sfn "$ROOT/node_modules" "$SITE/node_modules"
(cd "$SITE" && npx astro build >/dev/null)
python3 -I "$T/js.py"
node "$T/css.mjs" "$T/work/site.raw.css" "$SITE/dist"
{ echo '@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Unbounded:wght@500;600&display=swap");'
  cat "$T/work/site.raw.css"; echo
  echo '.ih-live .ih .header[data-astro-cid-3ef6ksr2]{position:fixed;left:0;right:0;top:0}.ih .tabs[data-astro-cid-hyvzkcdj].is-stuck{position:fixed;left:50%;translate:-50% 0;margin:0;z-index:45}'
  echo '.ih{display:flow-root}'; } > "$T/work/site.css"
python3 -I "$T/build.py" >/dev/null
echo "Готово: $T/work/blocks, стили проекта — $T/work/site.css"
