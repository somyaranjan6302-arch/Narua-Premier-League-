export const getSessionMediaKey = (mediaKey, session) => {
  const sessionName = String(session || '').match(/Season\s*\d+/i)?.[0] || String(session || '');
  const sessionSlug = sessionName
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sessionSlug ? `${mediaKey}-${sessionSlug}` : mediaKey;
};

export const getSiteMedia = (siteMedia, mediaKey, session, fallback) => (
  siteMedia[getSessionMediaKey(mediaKey, session)] ||
  siteMedia[mediaKey] ||
  fallback
);
