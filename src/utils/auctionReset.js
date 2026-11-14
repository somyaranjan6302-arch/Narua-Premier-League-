import { initialAuctionLiveState } from '../data/nplData.js';

const getTeamSessions = (team, season) => Array.isArray(team.sessions) ? team.sessions
  : Array.isArray(team.seasons) ? team.seasons
    : team.session ? [team.session] : [season];

export const resetAuctionForSeason = ({ state, registrations, teams, season }) => {
  const affectedPlayerIds = new Set([
    state.currentPlayer?.id,
    ...(state.soldPlayers || []).map((player) => player.playerId),
    ...(state.unsoldPlayers || []).map((player) => player.playerId || player.id)
  ].filter(Boolean));

  const resetRegistrations = registrations.map((registration) => {
    if (registration.season !== season || !affectedPlayerIds.has(registration.id)) return registration;

    const restored = { ...registration };
    const previousStatus = restored.auctionPreviousStatus;
    delete restored.auctionPreviousStatus;
    delete restored.soldTo;
    delete restored.soldToTeamId;
    delete restored.soldPrice;
    delete restored.unsold;

    if (registration.status === 'AUCTIONED') {
      restored.status = ['VERIFIED', 'SHORTLISTED'].includes(previousStatus) ? previousStatus : 'VERIFIED';
    } else if (registration.status === 'UNSOLD') {
      restored.status = 'VERIFIED';
    }
    return restored;
  });

  const resetTeams = teams.map((team) => {
    if (!Array.isArray(team.squad)) return team;
    const squad = team.squad.filter((player) => (
      !(player.season === season && affectedPlayerIds.has(player.id))
    ));
    return squad.length === team.squad.length ? team : { ...team, squad };
  });

  const purseCap = state.purseCap ?? initialAuctionLiveState.purseCap;
  const teamPurseCaps = state.teamPurseCaps || {};
  const teamPurses = Object.fromEntries(teams
    .filter((team) => team.active !== false && getTeamSessions(team, season).includes(season))
    .map((team) => [team.id, teamPurseCaps[team.id] ?? purseCap]));

  return {
    registrations: resetRegistrations,
    teams: resetTeams,
    auctionLiveState: {
      ...initialAuctionLiveState,
      purseCap,
      minimumBidIncrement: state.minimumBidIncrement ?? initialAuctionLiveState.minimumBidIncrement,
      maxSquadSize: state.maxSquadSize ?? initialAuctionLiveState.maxSquadSize,
      teamPurseCaps,
      teamPurses,
      auditLog: state.auditLog || []
    }
  };
};
