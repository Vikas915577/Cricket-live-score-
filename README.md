# Cricket Live Score V8

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
`CRICKETDATA_FREE_ONLY=1` is the default. V8 uses the official `cricScore` live/fixtures/results feed. The detailed fantasy scorecard endpoint is not called in free mode because the provider currently documents Fantasy APIs as paid/penalized on the lifetime-free plan. Missing detailed data is shown as unavailable rather than invented.

## Run locally
```bash
npm test
npm start
```
Then open `http://localhost:8080`.
