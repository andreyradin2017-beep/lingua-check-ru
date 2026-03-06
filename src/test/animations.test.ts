import { describe, it, expect } from "vitest";
import { cardVariants, pageVariants } from "../utils/animations";

describe("Animation Variants", () => {
  describe("cardVariants", () => {
    it("should have correct hidden state", () => {
      expect(cardVariants.hidden).toEqual({ opacity: 0 });
    });

    it("should generate correct visible state with delay", () => {
      const visibleState = cardVariants.visible as any;

      expect(visibleState.opacity).toBe(1);
      expect(visibleState.transition.duration).toBe(0.05);
    });
  });

  describe("pageVariants", () => {
    it("should have correct initial state", () => {
      expect(pageVariants.initial).toEqual({ opacity: 0 });
    });

    it("should have correct enter state", () => {
      const enter = pageVariants.enter as any;
      expect(enter.opacity).toBe(1);
      expect(enter.transition.duration).toBe(0.05);
    });
  });
});
