/** StoreWitness's deterministic, JSON-serializable observation rules. Times are epoch ms. */
export const INTERVAL_MS = 10_000;
export const REQUIRED_MATCHES = 3;
export const STALE_MS = 35_000;
export const MIN_SAMPLE_GAP_MS = 8_000;
export const MAX_SAMPLE_GAP_MS = 25_000;
export const MIN_CONFIDENCE = 0.85;
export const MAX_OVERRIDE_MS = 2 * 60 * 60 * 1000;

function time(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return null;
}
function clock(now) {
  const result = time(now);
  if (result === null) throw new TypeError('A valid server time is required.');
  return result;
}
function cleanReason(value, fallback) {
  return typeof value === 'string' && value.trim()
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180)
    : fallback;
}
function history(state, change) {
  return [...state.history, change].slice(-20);
}

export function initialState(now) {
  return {
    version: 1, createdAt: clock(now), source: null,
    lastObservationAt: null, lastSeenAt: null, latestStatus: null,
    confidence: null, reason: 'No observation received.',
    confirmed: null, lastConfirmedAt: null,
    candidate: null, count: 0, lastCountedAt: null,
    override: null, history: [],
  };
}

/** Invalid/repeated/reordered observations are no-ops, including object identity. */
export function observe(state, observation, now) {
  const receivedAt = clock(now);
  if (!observation || !['OPEN', 'CLOSED', 'UNCERTAIN'].includes(observation.status)
    || !['camera', 'replay'].includes(observation.source)) return state;
  const observedAt = time(observation.observedAt);
  if (observedAt === null || observedAt > receivedAt + 5_000
    || (state.lastObservationAt !== null && observedAt <= state.lastObservationAt)) return state;
  const confidence = observation.confidence;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)
    || confidence < 0 || confidence > 1) return state;

  // A client timestamp can never extend freshness beyond server receipt time.
  const seenAt = Math.min(observedAt, receivedAt);
  const changedSource = state.source !== null && state.source !== observation.source;
  const recoveringStale = state.lastSeenAt !== null && seenAt - state.lastSeenAt >= STALE_MS;
  const previous = changedSource || recoveringStale ? {
    ...state, confirmed: null, lastConfirmedAt: null,
    candidate: null, count: 0, lastCountedAt: null,
  } : state;
  const confident = observation.status !== 'UNCERTAIN' && confidence >= MIN_CONFIDENCE;
  const status = confident ? observation.status : 'UNCERTAIN';
  let next = {
    ...previous, source: observation.source, lastObservationAt: observedAt,
    lastSeenAt: seenAt, latestStatus: status, confidence,
    reason: cleanReason(observation.reason, confident ? 'Designated indicator observed.' : 'Observation is uncertain.'),
  };
  if (!confident || receivedAt - seenAt >= STALE_MS) {
    return { ...next, candidate: null, count: 0, lastCountedAt: null };
  }
  const gap = previous.lastCountedAt === null ? null : seenAt - previous.lastCountedAt;
  if (previous.candidate !== status || gap === null || gap > MAX_SAMPLE_GAP_MS) {
    next = { ...next, candidate: status, count: 1, lastCountedAt: seenAt };
  } else if (gap >= MIN_SAMPLE_GAP_MS) {
    next = { ...next, count: Math.min(REQUIRED_MATCHES, previous.count + 1), lastCountedAt: seenAt };
  }
  if (next.count >= REQUIRED_MATCHES && next.confirmed !== status) {
    next = {
      ...next, confirmed: status, lastConfirmedAt: seenAt,
      history: history(next, { status, source: next.source, at: seenAt }),
    };
  }
  return next;
}

export function setOverride(state, override, now) {
  const at = clock(now);
  if (!override || !['OPEN', 'CLOSED'].includes(override.status)) {
    throw new TypeError('Owner status must be OPEN or CLOSED.');
  }
  const expiresAt = time(override.expiresAt);
  if (expiresAt === null || expiresAt <= at || expiresAt > at + MAX_OVERRIDE_MS) {
    throw new RangeError('Owner override must expire within the next two hours.');
  }
  const reason = cleanReason(override.reason, 'Owner supplied a temporary status.');
  return {
    ...state, override: { status: override.status, expiresAt, reason, setAt: at },
    history: history(state, { status: override.status, source: 'owner', at, expiresAt }),
  };
}

export function clearOverride(state, now) {
  const at = clock(now);
  if (!state.override) return state;
  return {
    ...state, override: null,
    history: history(state, { status: 'OVERRIDE_CLEARED', source: 'owner', at }),
  };
}

export function publicStatus(state, now) {
  const at = clock(now);
  const base = {
    status: 'UNAVAILABLE', source: state.source,
    lastSeenAt: state.lastSeenAt, lastConfirmedAt: state.lastConfirmedAt,
    candidate: state.candidate, count: state.count, reason: state.reason,
  };
  if (state.override && state.override.expiresAt > at) {
    return { ...base, status: state.override.status, source: 'owner',
      reason: state.override.reason, override: { ...state.override } };
  }
  if (state.lastSeenAt === null || at - state.lastSeenAt >= STALE_MS) {
    return { ...base, candidate: null, count: 0,
      reason: state.lastSeenAt === null ? 'No observation received.' : 'Camera observations are stale. Status cannot be verified.' };
  }
  if (state.latestStatus === 'UNCERTAIN') {
    return { ...base, status: 'UNCERTAIN' };
  }
  // Retain a previous confirmed label during a fresh, unconfirmed transition.
  return { ...base, status: state.confirmed ?? 'UNCERTAIN',
    reason: state.confirmed && state.candidate !== state.confirmed
      ? `Last confirmed ${state.confirmed.toLowerCase()}; checking a possible change (${state.count}/3).`
      : state.confirmed ? state.reason : 'Waiting for three consistent observations.' };
}
