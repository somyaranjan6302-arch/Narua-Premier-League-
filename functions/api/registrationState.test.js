import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPublicRegistration,
  isRegistrationOpen,
  matchesRegistrationIdentity,
  PlayerRegistrationError
} from './registrationState.js';

const season = {
  edition: 'Season 6',
  year: '2027',
  registrationStatus: 'OPEN',
  registrationOpensAt: '2026-11-01',
  registrationClosesAt: '2026-11-30'
};
const body = {
  fullName: '  NPL Player  ',
  phone: '+91 98765 43210',
  email: 'player@example.com',
  role: 'Batsman',
  consent: true,
  status: 'VERIFIED',
  basePrice: '₹999999'
};
const identity = { id: 'reg-authoritative', registrationId: 'NPL2027-ABC12345' };

test('registration windows honor configured status and inclusive date bounds', () => {
  assert.equal(isRegistrationOpen(season, new Date('2026-11-01T00:00:00.000Z')), true);
  assert.equal(isRegistrationOpen(season, new Date('2026-11-30T00:00:00.000Z')), true);
  assert.equal(isRegistrationOpen(season, new Date('2026-10-31T23:59:59.000Z')), false);
  assert.equal(isRegistrationOpen(season, new Date('2026-12-01T00:00:00.000Z')), false);
  assert.equal(isRegistrationOpen({ ...season, registrationStatus: 'PAUSED' }), false);
});

test('registration records use server identity, pending status, and allowlisted fields', () => {
  const registration = createPublicRegistration(body, season, identity, new Date('2026-11-10T12:00:00.000Z'));
  assert.equal(registration.id, identity.id);
  assert.equal(registration.registrationId, identity.registrationId);
  assert.equal(registration.fullName, 'NPL Player');
  assert.equal(registration.status, 'PENDING');
  assert.equal(registration.basePrice, '₹100');
  assert.equal(Object.hasOwn(registration, 'adminRemarks'), false);
});

test('closed seasons and invalid registration data are rejected', () => {
  assert.throws(
    () => createPublicRegistration(body, { ...season, registrationStatus: 'CLOSED' }, identity),
    (error) => error instanceof PlayerRegistrationError && error.status === 409
  );
  assert.throws(
    () => createPublicRegistration({ ...body, role: 'Administrator' }, season, identity),
    /Registration details are incomplete/
  );
});

test('status lookup matches both registration ID and normalized phone', () => {
  const registration = { registrationId: identity.registrationId, phone: '+91 98765 43210' };
  assert.equal(matchesRegistrationIdentity(registration, identity.registrationId.toLowerCase(), '9876543210'), true);
  assert.equal(matchesRegistrationIdentity(registration, identity.registrationId, '9876543211'), false);
});
