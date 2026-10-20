# Installable app (PWA)

## Behavior

Users can install Valeriano on their devices from the browser. The app is
described by `public/manifest.json` (name, icons, theme and background colors
taken from the shadcn theme) and linked from the root route together with the
favicons.

## Scope

- A hand-written service worker, `public/sw.js`, registered in production only.
- It caches same-origin static GET assets only (`/assets/*`, icons, manifest,
  logo) with a cache-first strategy.

## Non-goals

- No offline chat or offline pages; the app requires the network.
- No caching of navigations, API, chat, or admin requests.

## Data and security

Nothing chat-related is stored by the service worker. Chat messages remain in
the browser only, as defined in `SPEC.md`.

## Acceptance criteria

- The browser reports the manifest as valid and offers installation.
- `/sw.js` is served and controls the page after the first production load.
- Non-static requests (pages, server functions, chat) are never answered from
  the cache.
