import { test } from 'node:test';
import assert from 'node:assert/strict';

async function browser({ local = null, cookie = '', blocked = false } = {}) {
  let saved = local;
  const jar = new Map(cookie ? [['369-review-device-id', cookie]] : []);
  globalThis.localStorage = {
    getItem() { if (blocked) throw Error('blocked'); return saved; },
    setItem(_key, value) { if (blocked) throw Error('blocked'); saved = value; },
  };
  globalThis.document = {
    get cookie() { return [...jar].map(([k,v]) => `${k}=${v}`).join('; '); },
    set cookie(value) { const [k,v] = value.split(';')[0].split('='); jar.set(k,v); },
  };
  globalThis.location = { protocol: 'https:' };
  const { getOrCreateDeviceId } = await import(`../client/src/lib/review/device.ts?test=${Math.random()}`);
  return { getOrCreateDeviceId, saved: () => saved, jar };
}

test('existing registration is retained and backed up in a cookie', async () => {
  const b = await browser({ local: 'original-browser' });
  assert.equal(b.getOrCreateDeviceId(), 'original-browser');
  assert.equal(b.jar.get('369-review-device-id'), 'original-browser');
});
test('lost local storage is restored from the backup', async () => {
  const b = await browser({ cookie: 'registered-browser' });
  assert.equal(b.getOrCreateDeviceId(), 'registered-browser');
  assert.equal(b.saved(), 'registered-browser');
});
test('blocked local storage uses the cookie across page reloads', async () => {
  const first = await browser({ blocked: true });
  const id = first.getOrCreateDeviceId();
  const second = await browser({ blocked: true, cookie: id });
  assert.equal(second.getOrCreateDeviceId(), id);
});
test('fresh browser gets a stable new identifier', async () => {
  const b = await browser();
  const id = b.getOrCreateDeviceId();
  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.equal(b.getOrCreateDeviceId(), id);
});
