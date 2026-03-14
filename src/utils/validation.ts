export const URL_REGEX = /^https?:\/\/(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:(?:\/|\/?)\S+)?$/i;

export const isValidUrl = (url: string): boolean => {
  return URL_REGEX.test(url);
};
