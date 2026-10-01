# Cricket Live Score V9

Mobile-first cricket live score dashboard with a free-first CricketData/CricAPI integration.

## Easiest API setup
1. Open `api-key.js` in the project root.
2. Paste your CricketData API key inside the quotes.
3. Run/deploy the project.

Example:
```js
export const CRICKETDATA_API_KEY = 'YOUR_KEY_HERE';
```

### Security
The local server blocks direct browser access to `api-key.js` and never sends the key to the frontend. For a PUBLIC GitHub repository, do **not** commit a real key. Add `CRICKETDATA_API_KEY` in Vercel Environment Variables instead.

## Free mode
`CRICKETDATA_FREE_ONLY=1` is the default. V9 uses the official `cricScore` live/fixtures/results feed. The detailed fantasy scorecard endpoint is not called in free mode because the provider currently documents Fantasy APIs as paid/penalized on the lifetime-free plan. Missing detailed data is shown as unavailable rather than invented.

## Run locally
```bash
npm test
npm start
```
Then open `http://localhost:8080`.


## API key
Put your key in `api-key.js` as `globalThis.CRICKETDATA_API_KEY = 'YOUR_KEY';`. V9 first tries the secure `/api/cricket` backend, then falls back to direct browser API mode when hosted without a backend. Direct browser mode exposes the key to site visitors, so use a server-side environment variable for a public production deployment.

## Recent results fix
The UI now reads `data`, `results`, `matches`, and other common provider buckets, recognizes completed/no-result/abandoned/won statuses, uses `dateTimeGMT` when available, deduplicates rows, and sorts recent completed matches. The official eCricScore documentation says its response includes last 7 days, next 7 days and current live matches.
