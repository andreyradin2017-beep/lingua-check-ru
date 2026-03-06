export const getProxiedImageUrl = (
  url: string | undefined,
): string | undefined => {
  if (!url) return url;

  // Avoid double proxying
  if (url.includes("i0.wp.com") || url.includes("weserv.nl") || url.includes("wsrv.nl")) {
    return url;
  }

  // List of domains that often face connection resets or should be proxied
  const proxyDomains = [
    "image.tmdb.org",
    "yt3.ggpht.com",
    "googleusercontent.com",
    "st.kp.yandex.net",
    "avatars.mds.yandex.net"
  ];

  const shouldProxy = proxyDomains.some(domain => url.includes(domain));

  if (shouldProxy) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  return url;
};
