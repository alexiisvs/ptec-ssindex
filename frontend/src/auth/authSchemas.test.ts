import { describe, expect, it } from "vitest";

import { registerSchema } from "./authSchemas";

describe("register schema", () => {
  it("accepts the expected onboarding fields", () => {
    const result = registerSchema.safeParse({
      username: "cat_user",
      email: "cat@example.com",
      password: "password123",
      passwordConfirmation: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects different passwords", () => {
    const result = registerSchema.safeParse({
      username: "cat_user",
      email: "cat@example.com",
      password: "password123",
      passwordConfirmation: "different123",
    });

    expect(result.success).toBe(false);
  });
});
