// Page-view counter backed by Upstash Redis (REST API — no SDK, keeps this static
// site dependency-free). POST increments and returns the new total; GET just reads.
// Env vars are provisioned by the Vercel Upstash integration; we accept either the
// Upstash-native names or Vercel's KV_* aliases.
export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  res.setHeader('Cache-Control', 'no-store');

  if (!url || !token) {
    res.status(500).json({ error: 'counter not configured' });
    return;
  }

  const command = req.method === 'POST' ? 'incr' : 'get';

  try {
    const upstream = await fetch(`${url}/${command}/views:home`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await upstream.json();
    res.status(200).json({ count: Number(data.result) || 0 });
  } catch {
    res.status(502).json({ error: 'counter unavailable' });
  }
}
