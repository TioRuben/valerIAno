# Installable app (PWA)

## Behavior

Users can install Valeriano on their devices from the browser. The app is
described by `public/manifest.json` (name "ValerIAno", maskable 192/512 icons,
`display: standalone`, `start_url: /`, theme color `#c2410c` and white
background) and linked from the root route together with the favicons and the
`theme-color` meta tag.

## Scope

- A hand-written service worker, `public/sw.js`, registered in production only.
- It caches same-origin static GET assets only (`/assets/*`, favicons, app
  icons, manifest and `valeriano.webp`) with a cache-first strategy under the
  versioned cache `valeriano-static-v1`; older caches are deleted on activate.

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
