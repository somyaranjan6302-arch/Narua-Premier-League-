export const getSessionMediaKey = (mediaKey, session) => {
  const sessionName = String(session || '').match(/Season\s*\d+/i)?.[0] || String(session || '');
  const sessionSlug = sessionName
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sessionSlug ? `${mediaKey}-${sessionSlug}` : mediaKey;
};

export const getRecordMediaKey = (record) => {
  const recordSlug = [record.season || 'all-time', record.title, record.holder]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `record:${recordSlug}`;
};

export const isHiddenTournamentRecord = (record) => (
  (
    record.title === 'Most Sixes in an Inning' &&
    record.holder === 'Chiku Das' &&
    record.value === '14 Sixes'
  ) || (
    record.title === 'Lowest Total' &&
    record.holder === 'Young Star Narua'
  ) || (
    record.title === 'Highest Team Total' &&
    record.holder === 'HP No Compromise'
  ) || (
    record.title?.toLowerCase().startsWith('best bowling') &&
    record.holder === 'Abhishek Das' &&
    String(record.value).replace(/\s/g, '') === '5/14'
  )
);

export const getChampionMediaKey = (champions, champion) => {
  const seasonNumber = Number(String(champion?.edition || '').match(/Season\s*(\d+)/i)?.[1]);
  if (seasonNumber === 2) return 'champion:season2';
  if (seasonNumber === 1) return 'champion:0';
  if (seasonNumber === 5) return 'champion:0';
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
    ? '/uploads/566bf1d697b581d4153a36df7f337ae8.png'
    : champion?.teamPhoto
);

export const getSiteMedia = (siteMedia, mediaKey, session, fallback) => (
  siteMedia[getSessionMediaKey(mediaKey, session)] ||
  siteMedia[mediaKey] ||
  fallback
);
