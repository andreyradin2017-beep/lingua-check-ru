import { describe, it, expect, vi, beforeEach } from "vitest";
import { vibrate, notificationOccurred, selectionChanged } from "./haptics";

describe("haptics utility", () => {
  const impactMock = vi.fn();
  const notificationMock = vi.fn();
  const selectionMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Telegram WebApp object
    (window as any).Telegram = {
      WebApp: {
        version: "8.0",
        HapticFeedback: {
          impactOccurred: impactMock,
          notificationOccurred: notificationMock,
          selectionChanged: selectionMock,
        },
      },
    };

    // Mock navigator.vibrate
    (navigator as any).vibrate = vi.fn();
  });

  it("should use Telegram haptics when available", () => {
    vibrate("medium");
    expect(impactMock).toHaveBeenCalledWith("medium");
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("should fallback to navigator.vibrate when Telegram is not available", () => {
    (window as any).Telegram = undefined;

    vibrate("light");
    expect(navigator.vibrate).toHaveBeenCalledWith(10);

    vibrate("heavy");
    expect(navigator.vibrate).toHaveBeenCalledWith([30]);
  });

  it("should handle notifications correctly (Telegram)", () => {
    notificationOccurred("success");
    expect(notificationMock).toHaveBeenCalledWith("success");
  });

  it("should handle notifications fallback (Navigator)", () => {
    (window as any).Telegram = undefined;

    notificationOccurred("error");
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 50, 30]);
  });

  it("should handle selection change", () => {
    selectionChanged();
    expect(selectionMock).toHaveBeenCalled();
  });
});
