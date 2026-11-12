import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, observe, publicStatus, setOverride, clearOverride, STALE_MS } from '../src/state.mjs';

const start = 1_800_000_000_000;
function sample(state, seconds, status = 'OPEN', extra = {}) {
  const now = start + seconds * 1000;
  return observe(state, { status, confidence: .99, source: 'camera', observedAt: now, ...extra }, now);
}
function confirmed(status = 'OPEN') {
  let s = initialState(start);
  for (const t of [0, 10, 20]) s = sample(s, t, status);
  return s;
}

test('one observation cannot publish a label; three spaced samples confirm', () => {
  let s = sample(initialState(start), 0);
  assert.equal(publicStatus(s, start).status, 'UNCERTAIN');
  s = sample(s, 10);
  assert.equal(publicStatus(s, start + 10_000).status, 'UNCERTAIN');
  s = sample(s, 20);
  assert.equal(publicStatus(s, start + 20_000).status, 'OPEN');
  assert.equal(s.history.length, 1);
});
test('duplicates and reordered timestamps are immutable no-ops', () => {
  const s = sample(initialState(start), 10);
  assert.equal(sample(s, 10), s);
  assert.equal(sample(s, 9), s);
});
test('fast samples cannot accelerate confirmation, and long gaps restart it', () => {
  let s = sample(initialState(start), 0);
  s = sample(s, 1); s = sample(s, 2); s = sample(s, 7);
  assert.equal(s.count, 1);
  s = sample(s, 8); assert.equal(s.count, 2);
  s = sample(s, 34); assert.equal(s.count, 1);
});
test('alternating labels restart candidate without falsely closing', () => {
  let s = confirmed();
  for (const [t, status] of [[30, 'CLOSED'], [40, 'OPEN'], [50, 'CLOSED']]) s = sample(s, t, status);
  assert.equal(publicStatus(s, start + 50_000).status, 'OPEN');
  assert.equal(s.count, 1);
});
test('uncertainty and low confidence immediately surface uncertainty and reset candidate', () => {
  let s = sample(confirmed(), 30, 'CLOSED', { confidence: .84 });
  assert.equal(publicStatus(s, start + 30_000).status, 'UNCERTAIN');
  assert.equal(s.confirmed, 'OPEN'); assert.equal(s.count, 0);
  s = sample(s, 40, 'UNCERTAIN');
  assert.equal(publicStatus(s, start + 40_000).status, 'UNCERTAIN');
});
test('stale observations become unavailable at 35 seconds; recovery reconfirms', () => {
  let s = confirmed();
  assert.equal(publicStatus(s, start + 20_000 + STALE_MS).status, 'UNAVAILABLE');
  s = sample(s, 60, 'CLOSED');
  assert.equal(s.count, 1);
  assert.equal(publicStatus(s, start + 60_000).status, 'UNCERTAIN');
  s = sample(s, 70, 'CLOSED'); s = sample(s, 80, 'CLOSED');
  assert.equal(publicStatus(s, start + 80_000).status, 'CLOSED');
});
test('future timestamp beyond tolerance is rejected; tolerated future cannot extend freshness', () => {
  const s = initialState(start);
  assert.equal(observe(s, {status:'OPEN', confidence:1, source:'camera', observedAt:start+5001}, start), s);
  const next = observe(s, {status:'OPEN', confidence:1, source:'camera', observedAt:start+4000}, start);
  assert.equal(next.lastSeenAt, start);
  assert.equal(publicStatus(next, start + STALE_MS).status, 'UNAVAILABLE');
});
test('old client frames cannot restore public freshness', () => {
  const s = observe(initialState(start), {status:'OPEN', confidence:1, source:'camera', observedAt:start}, start+60_000);
  assert.equal(publicStatus(s, start+60_000).status, 'UNAVAILABLE');
  assert.equal(s.count, 0);
});
test('replay stays explicitly marked and cannot combine with camera votes', () => {
  let s = confirmed();
  s = sample(s, 30, 'CLOSED', {source:'replay'});
  assert.equal(publicStatus(s, start+30_000).source, 'replay');
  assert.equal(publicStatus(s, start+30_000).status, 'UNCERTAIN');
  s = sample(s, 40, 'CLOSED', {source:'replay'});
  s = sample(s, 50, 'CLOSED', {source:'replay'});
  assert.equal(publicStatus(s, start+50_000).status, 'CLOSED');
});
test('owner override is explicit, expires and falls back to camera freshness', () => {
  const original = confirmed();
  const s = setOverride(original, {status:'CLOSED', expiresAt:start+40_000, reason:'Early closing today.'}, start+21_000);
  assert.equal(original.override, null);
  assert.equal(publicStatus(s, start+22_000).source, 'owner');
  assert.equal(publicStatus(s, start+22_000).reason, 'Early closing today.');
  assert.equal(publicStatus(s, start+40_000).status, 'OPEN');
  assert.equal(publicStatus(s, start+60_000).status, 'UNAVAILABLE');
  assert.equal(clearOverride(s, start+22_000).override, null);
});
test('overrides require valid status and expiration within two hours', () => {
  const s = initialState(start);
  assert.throws(()=>setOverride(s, {status:'UNCERTAIN',expiresAt:start+1000},start), TypeError);
  assert.throws(()=>setOverride(s, {status:'OPEN',expiresAt:start},start), RangeError);
  assert.throws(()=>setOverride(s, {status:'OPEN',expiresAt:start+7_200_001},start), RangeError);
});
test('history and counts stay bounded and state survives JSON round-trip', () => {
  let s = initialState(start);
  for(let i=0; i<100; i++) s = sample(s, i*10, Math.floor(i/3)%2 ? 'CLOSED':'OPEN');
  assert.equal(s.history.length,20); assert.ok(s.count<=3);
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
test('bad inputs do not mutate state', () => {
  const s = Object.freeze(initialState(start));
  for(const extra of [{confidence:NaN},{confidence:2},{source:'unknown'},{status:'BAD'},{observedAt:'invalid'}]) {
    assert.equal(sample(s,0,'OPEN',extra),s);
  }
});
