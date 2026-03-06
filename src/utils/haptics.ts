declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        version?: string;
        HapticFeedback?: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

const getTG = () => window.Telegram?.WebApp;

// Check if HapticFeedback is actually supported (requires TG version 7.0+)
const isHapticSupported = () => {
  const TG = getTG();
  if (!TG?.HapticFeedback) return false;
  
  // HapticFeedback was introduced in TG 7.0
  const version = TG.version || "0";
  const majorVersion = parseInt(version.split(".")[0] || "0", 10);
  return majorVersion >= 7;
};

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationType = "error" | "success" | "warning";

export const vibrate = (style: HapticStyle = "light") => {
  const TG = getTG();
  
  // 1. Try Telegram HapticFeedback if supported (best experience on TG)
  if (isHapticSupported()) {
    TG!.HapticFeedback!.impactOccurred(style);
    return;
  }

  // 2. Try Navigator Vibrate API (Android/Web)
  if (navigator.vibrate) {
    switch (style) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate([30]);
        break;
      case "rigid":
        navigator.vibrate([15]);
        break;
      case "soft":
        navigator.vibrate([5]);
        break;
    }
  }
};

export const notificationOccurred = (type: NotificationType) => {
  const TG = getTG();
  
  if (isHapticSupported()) {
    TG!.HapticFeedback!.notificationOccurred(type);
    return;
  }

  if (navigator.vibrate) {
    switch (type) {
      case "success":
        navigator.vibrate([10, 30, 10]);
        break;
      case "warning":
        navigator.vibrate([30, 50]);
        break;
      case "error":
        navigator.vibrate([50, 30, 50, 30]);
        break;
    }
  }
};

export const selectionChanged = () => {
  const TG = getTG();
  
  if (isHapticSupported()) {
    TG!.HapticFeedback!.selectionChanged();
    return;
  }

  if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};
