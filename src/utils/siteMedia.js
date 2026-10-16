export const getSessionMediaKey = (mediaKey, session) => {
  const sessionName = String(session || '').match(/Season\s*\d+/i)?.[0] || String(session || '');
  const sessionSlug = sessionName
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sessionSlug ? `${mediaKey}-${sessionSlug}` : mediaKey;
};

export const getChampionMediaKey = (champions, champion) => {
  const seasonNumber = Number(String(champion?.edition || '').match(/Season\s*(\d+)/i)?.[1]);
  if (seasonNumber === 2) return 'champion:season2';
  if (seasonNumber === 1) return 'champion:0';
  if (seasonNumber >= 3) return `champion:${seasonNumber - 2}`;

  const championIndex = champions.indexOf(champion);
  const legacyIndex = champions
    .slice(0, Math.max(championIndex, 0))
    .filter((item) => !/^Season\s*2$/i.test(item.edition || ''))
    .length;
  return `champion:${legacyIndex}`;
};

export const getChampionFallbackMedia = (champion) => (
  Number(String(champion?.edition || '').match(/Season\s*(\d+)/i)?.[1]) === 5
    ? '/uploads/5424446e978467501f09b5299b48fd24.png'
    : champion?.teamPhoto
);

export const getSiteMedia = (siteMedia, mediaKey, session, fallback) => (
  siteMedia[getSessionMediaKey(mediaKey, session)] ||
  siteMedia[mediaKey] ||
  fallback
);
