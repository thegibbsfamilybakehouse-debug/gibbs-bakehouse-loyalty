# Gibbs Bakehouse Loyalty (PWA)

A simple, branded PWA for stamps-based loyalty + daily specials.
- Splash fade-in each launch + optional gentle chime
- Customer, Staff, Specials, and Admin tabs
- Installable and offline-capable (manifest + service worker)
- Default landing tab: Specials

## Quick start

```bash
npm i
npm run dev
```

Open http://localhost:5173 to test.
Chrome → Install app (desktop) or Add to Home Screen (mobile).

## Build & preview production

```bash
npm run build
npm run preview
```

## Netlify deploy

- This repo includes `netlify.toml` and `/_redirects`.
- Use Netlify UI or CLI:

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

## Assets
- Icons: `public/icon-192x192.png`, `public/icon-512x512.png`
- Logos: `public/logo_cream.svg`, `public/icon_cream.svg`

## Notes
- Data is stored locally in the browser (localStorage) for testing.
- Optional next step: connect Firebase for multi-device sync and SMS login.
