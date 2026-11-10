const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const createTournamentStructureId = (prefix) => (
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
);

export const tournamentRoundTemplates = {
  'Round Robin': [
    'League Matches',
    'Super League',
    'Super Eight',
    'Super Ten',
    'Super Six',
    'Super Four',
    'Super Three',
    'Pre Quarter Final',
    'Quarter Final',
    'Semi Final',
    'Semi Final 1',
    'Semi Final 2',
    'Qualifier 1',
    'Eliminator',
    'Qualifier 2',
    'Final',
    'Third Position',
    'Fourth Position',
    'Fifth Position',
    'Warm up Match'
  ],
  'Knock Out': [
    'Super Knockout',
    'Round One',
    'Round Two',
    'Round Three',
    'Round Four',
    'Round Five',
    'Pre Quarter Final',
    'Quarter Final',
    'Semi Final',
    'Semi Final 1',
    'Semi Final 2',
    'Final',
    'Third Position',
    'Fourth Position',
    'Fifth Position',
    'Deciding Match'
  ]
};

export const getTournamentGroups = (season) => {
  const configuredGroups = Array.isArray(season?.groups)
    ? season.groups.filter((group) => group && typeof group.id === 'string' && typeof group.name === 'string')
    : [];
  const configuredNames = new Set(configuredGroups.map((group) => group.name.toLowerCase()));
  const configuredIds = new Set(configuredGroups.map((group) => group.id));
  const assignments = Object.values(season?.teamGroups || {}).flatMap((value) => (
    value && typeof value === 'object' ? Object.values(value) : [value]
  ));
  const legacyGroups = [...new Set(assignments.filter((value) => (
    typeof value === 'string' && value && !configuredIds.has(value) && !configuredNames.has(value.toLowerCase())
  )))].map((name) => ({
    id: `legacy-${slugify(name) || 'group'}`,
    name,
    roundId: null
  }));
  return [...configuredGroups, ...legacyGroups];
};

export const getTeamGroupId = (season, teamId, roundId = '') => {
  const assignments = season?.teamGroups || {};
  const configuredGroups = getTournamentGroups(season);
  const candidates = roundId
    ? [
      { roundId, value: assignments[roundId]?.[teamId] },
      { roundId: '', value: assignments[teamId] }
    ]
    : [
      ...Object.entries(assignments).flatMap(([assignedRoundId, roundAssignments]) => (
        roundAssignments && typeof roundAssignments === 'object'
          ? [{ roundId: assignedRoundId, value: roundAssignments[teamId] }]
          : []
      )),
      { roundId: '', value: assignments[teamId] }
    ];
  for (const candidate of candidates) {
    if (typeof candidate.value !== 'string' || !candidate.value) continue;
    const group = configuredGroups.find((item) => (
      (item.id === candidate.value || item.name === candidate.value)
      && (!candidate.roundId || !item.roundId || item.roundId === candidate.roundId)
      && (!roundId || !item.roundId || item.roundId === roundId)
    ));
    if (group) return group.id;
  }
  return '';
};

export const getTeamGroupName = (season, teamId, roundId = '') => {
  const groupId = getTeamGroupId(season, teamId, roundId);
  return getTournamentGroups(season).find((group) => group.id === groupId)?.name || '';
};
