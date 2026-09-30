const memoryCache = globalThis.__cricketCache || (globalThis.__cricketCache = new Map());
const LIVE_TTL = 3 * 60 * 1000;      // 3 minutes: stays under the advertised 500 calls/day on CricLive when used continuously.
const SCHEDULE_TTL = 12 * 60 * 60 * 1000;
const DETAIL_TTL = 15 * 60 * 1000;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(body));
};

async function readJsonResponse(response) {
  const text = await response.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: response.status, data };
}

async function fetchProvider(url, key) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    }
  });
  return readJsonResponse(response);
}

async function fetchCricLive(type, id) {
  const key = process.env.CRICLIVE_API_KEY;
  if (!key) throw new Error('CRICLIVE_API_KEY is not configured on the server.');

  const bases = ['https://cricketliveapi.com'];
  const paths = {
    live: ['/api/v1/live-scores', '/api/v1/cricket/live', '/v1/matches/live'],
    schedule: ['/api/v1/schedule', '/api/v1/cricket/schedule', '/v1/schedule'],
    scorecard: [`/api/v1/match/${encodeURIComponent(id)}/scorecard`, `/api/v1/cricket/match/${encodeURIComponent(id)}/scorecard`, `/v1/matches/${encodeURIComponent(id)}/scorecard`],
    commentary: [`/api/v1/match/${encodeURIComponent(id)}/commentary`, `/api/v1/cricket/match/${encodeURIComponent(id)}/commentary`, `/v1/matches/${encodeURIComponent(id)}/commentary`]
  };

  let last = null;
  for (const path of paths[type]) {
    const result = await fetchProvider(`${bases[0]}${path}`, key);
    last = result;
    if (result.status !== 404) return result;
  }
  return last;
}

async function getCached(key, ttl, loader) {
  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  const data = await loader();
  memoryCache.set(key, { at: Date.now(), data });
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const type = String(req.query?.type || 'live');
  const id = String(req.query?.id || '');
  if (!['live', 'schedule', 'scorecard', 'commentary'].includes(type)) {
    return json(res, 400, { error: 'Invalid type' });
  }
  if ((type === 'scorecard' || type === 'commentary') && !id) {
    return json(res, 400, { error: 'Match id is required' });
  }

  const ttl = type === 'live' ? LIVE_TTL : type === 'schedule' ? SCHEDULE_TTL : DETAIL_TTL;
  const cacheKey = `${type}:${id}`;

  try {
    const result = await getCached(cacheKey, ttl, async () => {
      const provider = await fetchCricLive(type, id);
      if (provider.status < 200 || provider.status >= 300) {
        const message = provider.data?.message || provider.data?.error || `Provider request failed (${provider.status})`;
        const err = new Error(message);
        err.status = provider.status;
        throw err;
      }
      return provider.data;
    });
    return json(res, 200, result);
  } catch (error) {
    const status = Number(error.status) >= 400 ? Number(error.status) : 500;
    return json(res, status, {
      error: error.message || 'Cricket API request failed',
      hint: 'Create a free CricLive API key and set CRICLIVE_API_KEY in the server environment.'
    });
  }
}
