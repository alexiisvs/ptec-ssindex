import { describe, expect, it } from "vitest";

import { CAT_IMAGES, pickNextCatImageIndex } from "./catImages";

describe("cat images", () => {
  it("contains ten unique local images", () => {
    expect(CAT_IMAGES).toHaveLength(10);
    expect(new Set(CAT_IMAGES.map((image) => image.src)).size).toBe(10);
  });

  it("never returns the previous image", () => {
    const randomValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.999999];

    for (let previous = 0; previous < CAT_IMAGES.length; previous += 1) {
      for (const value of randomValues) {
        const next = pickNextCatImageIndex(previous, () => value);
        expect(next).not.toBe(previous);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(CAT_IMAGES.length);
      }
    }
  });
});
