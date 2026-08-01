export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const STORAGE_KEY = "sscatfacts.login-rate-limit";

type StoredRateLimit = {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number | null;
};

export type LoginRateLimit = {
  remainingAttempts: number;
  blockedUntil: number | null;
};

function emptyRateLimit(now: number): StoredRateLimit {
  return { attempts: 0, windowStartedAt: now, blockedUntil: null };
}

function readStored(storage: Storage, now: number): StoredRateLimit {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyRateLimit(now);

  try {
    const value = JSON.parse(raw) as StoredRateLimit;
    if (now >= value.windowStartedAt + LOGIN_WINDOW_MS) {
      storage.removeItem(STORAGE_KEY);
      return emptyRateLimit(now);
    }
    return value;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return emptyRateLimit(now);
  }
}

function snapshot(value: StoredRateLimit): LoginRateLimit {
  return {
    remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - value.attempts),
    blockedUntil: value.blockedUntil,
  };
}

export function getLoginRateLimit(
  storage: Storage,
  now = Date.now(),
): LoginRateLimit {
  return snapshot(readStored(storage, now));
}

export function recordFailedLogin(
  storage: Storage,
  now = Date.now(),
): LoginRateLimit {
  const value = readStored(storage, now);
  value.attempts += 1;
  if (value.attempts >= MAX_LOGIN_ATTEMPTS) {
    value.blockedUntil = value.windowStartedAt + LOGIN_WINDOW_MS;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(value));
  return snapshot(value);
}

export function resetLoginRateLimit(storage: Storage): void {
  storage.removeItem(STORAGE_KEY);
}
