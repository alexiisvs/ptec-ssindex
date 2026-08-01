import { beforeEach, describe, expect, it } from "vitest";

import {
  getLoginRateLimit,
  LOGIN_WINDOW_MS,
  MAX_LOGIN_ATTEMPTS,
  recordFailedLogin,
  resetLoginRateLimit,
} from "./loginRateLimit";

describe("login rate limit", () => {
  const now = 1_000_000;

  beforeEach(() => window.localStorage.clear());

  it("blocks after five failed attempts", () => {
    let state = getLoginRateLimit(window.localStorage, now);

    for (let attempt = 0; attempt < MAX_LOGIN_ATTEMPTS; attempt += 1) {
      state = recordFailedLogin(window.localStorage, now);
    }

    expect(state.remainingAttempts).toBe(0);
    expect(state.blockedUntil).toBe(now + LOGIN_WINDOW_MS);
  });

  it("resets after the login window expires", () => {
    recordFailedLogin(window.localStorage, now);

    expect(
      getLoginRateLimit(window.localStorage, now + LOGIN_WINDOW_MS),
    ).toEqual({
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      blockedUntil: null,
    });
  });

  it("clears attempts after a successful login", () => {
    recordFailedLogin(window.localStorage, now);
    resetLoginRateLimit(window.localStorage);

    expect(getLoginRateLimit(window.localStorage, now)).toEqual({
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      blockedUntil: null,
    });
  });
});
