import { useEffect } from 'react';
import { useNpl } from '../context/NplContext';
import { LiveAuctionArenaModal } from './modals/LiveAuctionArenaModal';

export default function AuctionBroadcast() {
  const { selectedSeason, setSelectedSeason, isAdminLoggedIn } = useNpl();

  useEffect(() => {
    const requestedSeason = new URLSearchParams(window.location.search).get('season');
    if (requestedSeason && requestedSeason !== selectedSeason) {
      setSelectedSeason(requestedSeason);
    }
  }, [selectedSeason, setSelectedSeason]);

  return <LiveAuctionArenaModal standalone isAdminControl={isAdminLoggedIn} />;
}
