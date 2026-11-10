const allowedPlayerRoles = new Set(['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper']);

export class PlayerRegistrationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const isRegistrationOpen = (season, now = new Date()) => {
  if (season?.registrationStatus !== 'OPEN') return false;
  const today = now.toISOString().slice(0, 10);
  return (!season.registrationOpensAt || today >= season.registrationOpensAt) &&
    (!season.registrationClosesAt || today <= season.registrationClosesAt);
};

export const createPublicRegistration = (body, season, identity, now = new Date()) => {
  if (!season) throw new PlayerRegistrationError('Choose a valid registration season.');
  if (!isRegistrationOpen(season, now)) {
    throw new PlayerRegistrationError('Player registration is closed for this season.', 409);
  }

  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const phoneDigits = phone.replace(/\D/g, '');
  const photo = typeof body?.photo === 'string' ? body.photo : '';
  if (!body || typeof body !== 'object' || Array.isArray(body) || !fullName || fullName.length > 120 ||
    phoneDigits.length < 7 || phoneDigits.length > 15 ||
    (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
    !allowedPlayerRoles.has(body.role) || body.consent !== true ||
    (photo && (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 350000))) {
    throw new PlayerRegistrationError('Registration details are incomplete.');
  }

  const dob = typeof body.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dob) &&
    new Date(`${body.dob}T00:00:00.000Z`).toISOString().slice(0, 10) === body.dob
    ? body.dob
    : '';
  return {
    id: identity.id,
    registrationId: identity.registrationId,
    fullName,
    dob,
    phone,
    email,
    location: typeof body.location === 'string' ? body.location.trim().slice(0, 120) : '',
    role: body.role,
    battingStyle: typeof body.battingStyle === 'string' ? body.battingStyle.slice(0, 80) : '',
    bowlingStyle: typeof body.bowlingStyle === 'string' ? body.bowlingStyle.slice(0, 80) : '',
    previousExperience: typeof body.previousExperience === 'string' ? body.previousExperience.slice(0, 80) : '',
    previousTeam: typeof body.previousTeam === 'string' ? body.previousTeam.trim().slice(0, 120) : '',
    previousSeason: typeof body.previousSeason === 'string' ? body.previousSeason.slice(0, 20) : '',
    bio: typeof body.bio === 'string' ? body.bio.trim().slice(0, 1000) : '',
    instagram: typeof body.instagram === 'string' ? body.instagram.trim().slice(0, 120) : '',
    photo,
    consent: true,
    basePrice: '\u20b9100',
    season: season.edition,
    status: 'PENDING',
    createdAt: now.toISOString()
  };
};

export const matchesRegistrationIdentity = (registration, registrationId, phone) => {
  const registeredPhone = registration?.phone?.replace(/\D/g, '') || '';
  const submittedPhone = phone.replace(/\D/g, '');
  const phoneMatches = registeredPhone === submittedPhone ||
    (registeredPhone === `91${submittedPhone}` && submittedPhone.length === 10) ||
    (submittedPhone === `91${registeredPhone}` && registeredPhone.length === 10);
  return registration?.registrationId?.toUpperCase() === registrationId.trim().toUpperCase() && phoneMatches;
};
