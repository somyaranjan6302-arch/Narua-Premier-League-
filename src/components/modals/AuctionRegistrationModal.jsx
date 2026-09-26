import React, { useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { X, Flame, ShieldCheck, CheckCircle2, User, Phone, Mail, MapPin, Award, Camera, QrCode, Download, Printer } from 'lucide-react';

export const AuctionRegistrationModal = ({ onClose }) => {
  const { registerPlayerForAuction } = useNpl();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredData, setRegisteredData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '2000-01-01',
    phone: '',
    email: '',
    location: '',
    role: 'All-Rounder',
    battingStyle: 'Right Hand',
    bowlingStyle: 'Right Arm Medium Fast',
    basePrice: '₹40,000',
    previousExperience: 'Yes',
    previousTeam: 'Local League',
    previousSeason: '2025',
    matches: 12,
    runs: 340,
    wickets: 14,
    bestPerformance: '54* & 3/19',
    bio: '',
    instagram: '',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    consent: false
  });

  const samplePhotos = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.consent) {
      alert("Please enter full name, mobile number and accept consent.");
      return;
    }

    const newPlayer = registerPlayerForAuction(formData);
    setRegisteredData(newPlayer);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#091124] border-2 border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0C1630] to-slate-950 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                OFFICIAL PORTAL
              </span>
              <h3 className="font-sports text-2xl sm:text-3xl text-white tracking-wide leading-none">
                NPL AUCTION REGISTRATION 2026
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <User className="w-4 h-4 text-amber-400" />
                  <h4 className="font-sports text-lg text-white tracking-wider">
                    1. PLAYER INFORMATION
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Subir Karmakar"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Mobile Number (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="player@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Village / Town / Location (Narua & surrounding districts)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Narua East Gram, Bengal"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Profile Photo selector */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Profile Photo (Choose Avatar or URL)</span>
                      <span className="text-[10px] text-amber-400">Photo will appear on Auction Screen</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/50 flex-shrink-0 bg-slate-800">
                        <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-grow space-y-2">
                        <input
                          type="text"
                          value={formData.photo}
                          onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                          placeholder="Paste photo URL"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Sample Avatars:</span>
                          {samplePhotos.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setFormData({ ...formData, photo: url })}
                              className={`w-6 h-6 rounded-full overflow-hidden border ${formData.photo === url ? "border-amber-400 ring-2 ring-amber-400" : "border-slate-700"}`}
                            >
                              <img src={url} alt={`sample ${i}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Cricket Information */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h4 className="font-sports text-lg text-white tracking-wider">
                    2. CRICKET PROFILE & STATS
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Primary Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-Rounder">All-Rounder</option>
                      <option value="Wicketkeeper">Wicketkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Batting Style
                    </label>
                    <select
                      value={formData.battingStyle}
                      onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Right Hand">Right Hand</option>
                      <option value="Left Hand">Left Hand</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Bowling Style
                    </label>
                    <select
                      value={formData.bowlingStyle}
                      onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Right Arm Fast">Right Arm Fast</option>
                      <option value="Right Arm Medium">Right Arm Medium</option>
                      <option value="Right Arm Spin">Right Arm Spin</option>
                      <option value="Left Arm Fast">Left Arm Fast</option>
                      <option value="Left Arm Medium">Left Arm Medium</option>
                      <option value="Left Arm Spin">Left Arm Spin</option>
                      <option value="Not Applicable">Not Applicable</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Matches Played
                    </label>
                    <input
                      type="number"
                      value={formData.matches}
                      onChange={(e) => setFormData({ ...formData, matches: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Total Runs Scored
                    </label>
                    <input
                      type="number"
                      value={formData.runs}
                      onChange={(e) => setFormData({ ...formData, runs: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Wickets Taken
                    </label>
                    <input
                      type="number"
                      value={formData.wickets}
                      onChange={(e) => setFormData({ ...formData, wickets: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Best Performance Highlights
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 78* in District Final, 4/18 bowling figures"
                      value={formData.bestPerformance}
                      onChange={(e) => setFormData({ ...formData, bestPerformance: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Player Bio & Playing Strengths
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share your strengths, preferred batting position, or bowling variations..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Consent */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    "I confirm that the information provided is accurate and agree to adhere to all Narua Premier League rules and technical committee trial guidelines."
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-sports text-xl tracking-wider uppercase bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black hover:opacity-95 transition-opacity shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
              >
                <Flame className="w-5 h-5 fill-current" />
                <span>REGISTER FOR NPL AUCTION</span>
              </button>
            </form>
          ) : (
            /* Digital Player Pass View on Successful Submission */
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">
                  REGISTRATION SUCCESSFUL
                </span>
                <h3 className="font-sports text-3xl sm:text-4xl text-white tracking-wide mt-1">
                  OFFICIAL NPL AUCTION PASS
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                  Keep your Registration ID for future communication and trial summons.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="max-w-md mx-auto glass-panel-gold rounded-3xl p-6 border-2 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.3)] text-left relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
                  <div>
                    <span className="font-sports text-xl text-white">NARUA PREMIER LEAGUE</span>
                    <span className="text-[10px] text-amber-300 block font-bold">MEGA AUCTION 2026 PASS</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-[10px] font-bold text-amber-300 uppercase">
                    PENDING VERIFICATION
                  </span>
                </div>

                <div className="flex items-center gap-4 my-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/60 flex-shrink-0">
                    <img src={registeredData?.photo} alt={registeredData?.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg text-white">
                      {registeredData?.fullName}
                    </h4>
                    <span className="text-xs font-semibold text-amber-400 block">
                      {registeredData?.role}
                    </span>
                    <span className="text-xs text-slate-300 block mt-0.5">
                      {registeredData?.location || "Bengal"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Assigned Reg ID</span>
                    <span className="font-sports text-xl text-amber-400 tracking-wider">
                      {registeredData?.registrationId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Base Price Bracket</span>
                    <span className="font-sports text-xl text-white tracking-wider">
                      {registeredData?.basePrice}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between text-slate-400 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>NPL-VERIFY-{registeredData?.registrationId}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Official Pass</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Pass</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-sports tracking-wider text-base hover:bg-amber-400"
                >
                  DONE & RETURN TO SITE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
