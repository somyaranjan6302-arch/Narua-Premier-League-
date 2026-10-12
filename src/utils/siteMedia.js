export const getSessionMediaKey = (mediaKey, session) => {
  const sessionName = String(session || '').match(/Season\s*\d+/i)?.[0] || String(session || '');
  const sessionSlug = sessionName
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sessionSlug ? `${mediaKey}-${sessionSlug}` : mediaKey;
};

export const getChampionMediaKey = (champions, champion) => {
  if (champion?.edition === 'Season 2') return 'champion:season2';

  const championIndex = champions.indexOf(champion);
  const legacyIndex = champions
    .slice(0, championIndex)
    .filter((item) => item.edition !== 'Season 2')
    .length;
  return `champion:${legacyIndex}`;
};

export const getSiteMedia = (siteMedia, mediaKey, session, fallback) => (
  siteMedia[getSessionMediaKey(mediaKey, session)] ||
  siteMedia[mediaKey] ||
  fallback
);
