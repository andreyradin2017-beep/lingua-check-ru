import { db } from "../db/db";
import { logger } from "../utils/logger";

export const getApiKey = async (
  settingsKey?: string,
  envKey?: string,
): Promise<string | undefined> => {
  if (settingsKey) {
    // Priority 1: localStorage
    const localValue = localStorage.getItem(settingsKey);
    if (localValue && localValue !== "test-key" && localValue.trim() !== "")
      return localValue;

    // Priority 2: Database
    try {
      const settings = await db.settings.get(settingsKey);
      if (settings?.value) return settings.value;
    } catch (e) {
      logger.error(`Error fetching setting: ${settingsKey}`, "apiKeys", e);
    }
  }

  // Priority 3: Env fallback
  if (envKey) {
    return import.meta.env[envKey];
  }

  return undefined;
};
