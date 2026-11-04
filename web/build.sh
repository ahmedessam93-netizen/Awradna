#!/usr/bin/env bash
# Builds the Awradna website: the app for web (iPhone and computers), the notification
# server, the Android download page and the privacy page, into ../web-dist.
set -euo pipefail
cd "$(dirname "$0")"
OUT=../web-dist
rm -rf "$OUT"
(cd ../mobile && EXPO_OFFLINE=1 npx expo export --platform web --output-dir "../web-dist" >/dev/null)
cp netlify.toml package.json "$OUT"/
cp -r netlify "$OUT"/
cp -r static/. "$OUT"/
echo "built $(du -sh "$OUT" | cut -f1) in web-dist"
