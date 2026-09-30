# Cricket Live Score V4 — Real API Integration

V4 keeps the V3 mobile-first PWA UI but replaces the fake live feed with a real server-side cricket API connection.

## What is connected

- Live/current matches from CricLive API
- Upcoming schedule endpoint
- On-demand match scorecard endpoint
- On-demand ball-by-ball commentary endpoint
- Server-side API proxy so the secret key is not shipped to the browser
- 3-minute server cache for live data to reduce API quota usage
- 12-hour schedule cache
- 15-minute scorecard/commentary cache
- Automatic live refresh every 3 minutes while API is working
- Demo fallback when the API key is missing or provider is temporarily unavailable
- PWA/offline shell and the existing search, filters, favourites, dark mode and ads layout

## Free API

The current CricLive website advertises a free tier of 500 API calls/day and 5 requests/minute. It also documents live scores, scorecards and ball-by-ball endpoints.

Create your key in the provider dashboard, then keep it server-side. Never paste the real key into `app.js` or commit it to GitHub.

## Local test

1. Get a free CricLive API key.
2. Set an environment variable:

```bash
export CRICLIVE_API_KEY="YOUR_FREE_API_KEY"
```

On Windows PowerShell:

```powershell
$env:CRICLIVE_API_KEY="YOUR_FREE_API_KEY"
```

3. Start:

```bash
npm start
```

4. Open `http://localhost:8080`.

## Vercel deployment

This repo includes `api/cricket.js`, so the same project can serve the UI and the API proxy.

Add this environment variable in Vercel:

`CRICLIVE_API_KEY = your_real_key`

Then deploy the repository. The browser calls `/api/cricket`, while the provider key remains in the server environment.

## Important quota note

The free 500-call/day limit is a provider claim and can change. V4 deliberately caches live data for 3 minutes. That is about 480 live-provider calls/day in a continuously running single server process, before any schedule/scorecard/commentary calls. A public multi-user app can still exceed the free quota because API limits are attached to the provider key, not to each visitor.

## Files

- `app.js` — V4 frontend, normalization and UI
- `api/cricket.js` — Vercel server-side proxy
- `server.mjs` — zero-dependency local server + API proxy
- `.env.example` — environment variable template
- `vercel.json` — deployment config
