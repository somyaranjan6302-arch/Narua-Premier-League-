import test from 'node:test';
import assert from 'node:assert/strict';
import { getTeamGroupId, getTeamGroupName, getTournamentGroups, tournamentRoundTemplates } from './tournamentStructure.js';

test('round templates provide round-robin and knockout tournament stages', () => {
  assert.ok(tournamentRoundTemplates['Round Robin'].includes('League Matches'));
  assert.ok(tournamentRoundTemplates['Knock Out'].includes('Semi Final'));
});

test('team groups retain their round association and resolve assigned group names', () => {
  const season = {
    groups: [
      { id: 'group-a', name: 'Group A', roundId: 'league' },
      { id: 'group-b', name: 'Group B', roundId: 'playoffs' }
    ],
    teamGroups: {
      league: { team1: 'group-a' },
      playoffs: { team1: 'group-b' }
    }
  };

  assert.deepEqual(getTournamentGroups(season), season.groups);
  assert.equal(getTeamGroupId(season, 'team1', 'league'), 'group-a');
  assert.equal(getTeamGroupId(season, 'team1', 'playoffs'), 'group-b');
  assert.equal(getTeamGroupId(season, 'team1', 'other-round'), '');
  assert.equal(getTeamGroupName(season, 'team1'), 'Group A');
});

test('legacy team group names remain available during group model upgrade', () => {
  const season = { teamGroups: { team1: 'Group A', team2: 'Group B' } };
  const groups = getTournamentGroups(season);

  assert.deepEqual(groups.map((group) => group.name), ['Group A', 'Group B']);
  assert.equal(getTeamGroupName(season, 'team1'), 'Group A');
  assert.equal(getTeamGroupId(season, 'team2'), 'legacy-group-b');
});

test('unassigned teams resolve to no group', () => {
  assert.equal(getTeamGroupId({ groups: [], teamGroups: {} }, 'team1'), '');
  assert.equal(getTeamGroupName({ groups: [], teamGroups: {} }, 'team1'), '');
});
