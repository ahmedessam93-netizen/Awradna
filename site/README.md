# أورادنا — installable web app

Everything in this folder is the finished app. It is static: no server code, no database, no accounts.

## Put it online (10 minutes, free)

Any static host works. Two easy options:

**Netlify (drag and drop)**
1. Go to app.netlify.com → "Add new site" → "Deploy manually".
2. Drag this whole folder onto the page.
3. You get a link like `https://awradna.netlify.app`. Add your own domain later from "Domain settings".

**GitHub Pages**
1. Create a repository, upload this folder's contents to its root.
2. Settings → Pages → Source: "Deploy from a branch" → `main` / root.
3. The app is served at `https://<user>.github.io/<repo>/`.

Requirements: HTTPS (both hosts give it automatically). That is what makes "Add to Home Screen", offline mode and location work.

## What's inside

- `index.html` — the whole app (UI, reading plan, prayer-time engine, calendar export).
- `pages/` — 212 page images from the book, cropped to the text block (WebP, ~110 KB each).
- `sw.js` — service worker: caches the app and every page once read, so it works offline.
- `manifest.webmanifest`, `icons/` — home-screen install on iPhone and Android.

## Updating

Edit `index.html` and re-upload. The service worker version is derived from the file contents at build time; to force clients to refresh after a manual edit, change the `VERSION` string in `sw.js`.

## Phase 2 (App Store / Google Play, widgets, native notifications)

Wrap this folder with Capacitor (`npm i @capacitor/core @capacitor/cli`, `npx cap init`, copy this folder as `www/`). Local notifications: `@capacitor/local-notifications`. Widgets need a small native WidgetKit (iOS) / AppWidget (Android) target that reads the same localStorage-backed state. Needs a Mac with Xcode for iOS.
