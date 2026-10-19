import React from 'react';
import { useNpl } from '../context/NplContext';
import { Star } from 'lucide-react';
import { getSiteMedia, getRecordMediaKey, getRecordPartnerMediaKey, isHiddenTournamentRecord } from '../utils/siteMedia';
import { AwardBannerCard } from './AwardBannerCard';

export const NplRecords = () => {
  const { records, teams, siteMedia, selectedSeason } = useNpl();
  const visibleRecords = records.filter((record) => !isHiddenTournamentRecord(record));
  const demoRecord = import.meta.env.DEV
    ? visibleRecords.find((record) => record.title === 'Highest Individual Score' && record.season === 'Season 5')
      || visibleRecords.find((record) => record.title === 'Highest Individual Score')
    : null;
  const getRecordTeam = (record) => {
    const findTeamInText = (text) => [...teams]
      .sort((first, second) => second.name.length - first.name.length)
      .find((team) => {
        const name = team.name.trim().toLowerCase();
        return name && (text.includes(name) || name.includes(text.trim()));
      });
    return findTeamInText(record.holder || '')
      || findTeamInText(record.details || '');
  };

  return (
    <section id="records" className="npl-section-bg border-t border-slate-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
            <Star className="w-3.5 h-3.5" />
            <span>HISTORIC MILESTONES</span>
          </div>
          <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
            NPL <span className="text-gold-gradient">RECORDS</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            The extraordinary tournament benchmarks, records, and unbreakable performances in Narua cricket history.
          </p>
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
          {visibleRecords.map((rec, idx) => {
            const team = getRecordTeam(rec);
            const recordMediaKey = getRecordMediaKey(rec);
            const teamLogo = team
              ? getSiteMedia(siteMedia, `team-logo:${team.id}`, rec.season || selectedSeason, team.logo)
              : '';
            const uploadedPhoto = getSiteMedia(siteMedia, recordMediaKey, undefined, rec.photo);
            const isPartnership = rec.title === 'Highest Partnership';
            const partnerPhoto = isPartnership
              ? getSiteMedia(siteMedia, getRecordPartnerMediaKey(rec))
              : '';
            const photo = import.meta.env.DEV
              ? uploadedPhoto || (rec === demoRecord ? '/local-demo-player.png' : '')
              : uploadedPhoto;
            const teamName = team?.shortName || team?.name || rec.holder || 'NPL';
            const details = rec.title === 'Fastest Fifty' && /chiku das/i.test(rec.holder || '')
              ? rec.details?.replace(/\b7(?=\s+Sixes\b)/i, '6')
              : rec.details;

            return (
              <AwardBannerCard
                key={recordMediaKey || idx}
                title={rec.title}
                name={rec.holder}
                value={rec.value}
                valueLabel="Record"
                details={details}
                photo={photo}
                partnerPhoto={partnerPhoto}
                pairedPhotos={isPartnership}
                teamLogo={teamLogo}
                teamName={teamName}
                primaryColor={team?.primaryColor || '#0e7490'}
                secondaryColor={team?.secondaryColor || '#075985'}
              />
            );
          })}
          {visibleRecords.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
              No tournament records are available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
