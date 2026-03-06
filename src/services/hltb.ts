export interface HLTBData {
  main: string;
  extra: string;
  completionist: string;
}

/**
 * HLTB (HowLongToBeat) API is not accessible from the browser without a
 * dedicated backend proxy, as the site actively blocks all public CORS proxies.
 * This function is intentionally disabled and always returns null.
 * Game playtime data is provided by RAWG API's `playtime` field instead.
 */
export const fetchHLTBStats = async (
  _title: string,
): Promise<HLTBData | null> => {
  return null;
};
