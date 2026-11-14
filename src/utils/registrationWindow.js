export const getRegistrationWindowStatus = (season, now = new Date()) => {
  if (season?.registrationStatus === 'PAUSED') return 'PAUSED';
  if (!['OPEN', 'SCHEDULED'].includes(season?.registrationStatus)) return 'CLOSED';

  const opensAt = season.registrationOpensAt || '';
  const closesAt = season.registrationClosesAt || '';
  if (season.registrationStatus === 'SCHEDULED' && (!opensAt || !closesAt)) return 'SCHEDULED';

  const today = now.toISOString().slice(0, 10);
  if (opensAt && today < opensAt) return 'SCHEDULED';
  if (closesAt && today > closesAt) return 'CLOSED';
  return 'OPEN';
};

export const isRegistrationOpen = (season, now = new Date()) => (
  getRegistrationWindowStatus(season, now) === 'OPEN'
);
