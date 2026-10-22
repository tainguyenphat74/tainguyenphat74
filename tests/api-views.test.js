import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/views.js';

function response() {
  const result = { headers: {} };
  const res = {
    setHeader(name, value) {
      result.headers[name] = value;
      return this;
    },
    status(code) {
      result.status = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  return { result, res };
}

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
});

test('rejects unsupported methods before configuration lookup', async () => {
  process.env = {};
  const { result, res } = response();

  await handler({ method: 'PUT' }, res);

  assert.equal(result.status, 405);
  assert.equal(result.headers.Allow, 'GET, POST');
  assert.deepEqual(result.body, { error: 'method not allowed' });
});

test('returns 500 for an unconfigured valid request', async () => {
  process.env = {};
  const { result, res } = response();

  await handler({ method: 'GET' }, res);

  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { error: 'counter not configured' });
});

test('reads the counter for GET', async () => {
  process.env = { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'secret' };
  const calls = [];
  globalThis.fetch = async (...args) => {
    calls.push(args);
    return { ok: true, async json() { return { result: '42' }; } };
  };
  const { result, res } = response();

  await handler({ method: 'GET' }, res);

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { count: 42 });
  assert.equal(calls[0][0], 'https://redis.test/get/views:home');
});

test('increments the counter for POST', async () => {
  process.env = { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'secret' };
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return { ok: true, async json() { return { result: '43' }; } };
  };
  const { result, res } = response();

  await handler({ method: 'POST' }, res);

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { count: 43 });
  assert.equal(requestedUrl, 'https://redis.test/incr/views:home');
});

test('maps an upstream HTTP failure to 502', async () => {
  process.env = { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'secret' };
  globalThis.fetch = async () => ({ ok: false, async json() { return { error: 'upstream failure' }; } });
  const { result, res } = response();

  await handler({ method: 'GET' }, res);

  assert.equal(result.status, 502);
  assert.deepEqual(result.body, { error: 'counter unavailable' });
});

test('maps a network failure to 502', async () => {
  process.env = { UPSTASH_REDIS_REST_URL: 'https://redis.test', UPSTASH_REDIS_REST_TOKEN: 'secret' };
  globalThis.fetch = async () => { throw new Error('network down'); };
  const { result, res } = response();

  await handler({ method: 'GET' }, res);

  assert.equal(result.status, 502);
  assert.deepEqual(result.body, { error: 'counter unavailable' });
});
