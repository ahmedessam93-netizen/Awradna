#!/usr/bin/env bash
# Builds the web version of Awradna for GitHub Pages (iPhone: add to Home Screen),
# under a sub-path. The Netlify site (web/build.sh) is the full version with notifications.
#   bash scripts/build_pages.sh <out dir>      e.g. ../docs/app
set -euo pipefail
cd "$(dirname "$0")/.."
BASE=/Awradna/app
OUT=$(realpath -m "$1")
rm -rf "$OUT"
WEB_BASE=$BASE EXPO_OFFLINE=1 npx expo export --platform web --output-dir "$OUT" >/dev/null
# the page's own links (manifest, icons) live under the sub-path too
sed -i "s#href=\"/manifest.webmanifest\"#href=\"$BASE/manifest.webmanifest\"#; s#href=\"/icons/#href=\"$BASE/icons/#" "$OUT/index.html"
sed -i "s#\"start_url\": \"/\"#\"start_url\": \"./\"#; s#\"scope\": \"/\"#\"scope\": \"./\"#; s#\"src\": \"/icons/#\"src\": \"icons/#" "$OUT/manifest.webmanifest"
# the Android page and the notification worker belong to the Netlify site
rm -rf "$OUT/metadata.json" "$OUT/android" "$OUT/sw.js"
# an offline worker of its own: it saves the whole app, book pages included, on the first open
python3 - "$OUT" scripts/sw-pages.js <<'PY'
import hashlib, json, os, sys
out, tpl = sys.argv[1], sys.argv[2]
files = sorted(os.path.relpath(os.path.join(d, n), out) for d, _, ns in os.walk(out) for n in ns
               if n not in ('sw.js', 'index.html', 'privacy.html') and not n.startswith('.'))
h = hashlib.sha1()
for f in files: h.update(f.encode()); h.update(str(os.path.getsize(os.path.join(out, f))).encode())
h.update(open(os.path.join(out, 'index.html'), 'rb').read())
src = open(tpl).read().replace('__VERSION__', h.hexdigest()[:12]).replace('__FILES__', json.dumps(files))
open(os.path.join(out, 'sw.js'), 'w').write(src)
print(f'offline worker: {len(files)} files')
PY
echo "built $(du -sh "$OUT" | cut -f1) in $OUT"
