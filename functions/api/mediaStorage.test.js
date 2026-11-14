import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { onRequest } from './[[path]].js';

test('stores a private auction cutout in D1 when no R2 binding is configured', async () => {
  const sessionToken = 'test-poster-session-token-that-is-long-enough-to-validate';
  const registration = {
    id: 'reg-test-123',
    posterSessionTokenHash: createHash('sha256').update(sessionToken).digest('hex')
  };
  const d1Batches = [];
  const db = {
    prepare(query) {
      return {
        bind(...values) {
          return {
            first: async () => query.includes('FROM npl_auction_registrations')
              ? { value: JSON.stringify(registration) }
              : null,
            run: async () => ({ success: true, meta: { changes: 1 } }),
            values
          };
        }
      };
    },
    batch: async (statements) => {
      d1Batches.push(statements);
      return [];
    }
  };
  const form = new FormData();
  form.set('id', registration.id);
  form.set('sessionToken', sessionToken);
  form.set('cutout', new Blob([Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0
  ])], { type: 'image/png' }), 'cutout.png');

  const response = await onRequest({
    request: new Request('https://npl.test/api/auction-registrations/cutout', {
      method: 'POST',
      body: form
    }),
    env: { DB: db }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(body.auctionCutoutPhoto, /^\/api\/media\/auction-player-cutout%3Areg-test-123\?v=/);
  assert.equal(d1Batches.length, 1);
  assert.equal(d1Batches[0].length, 3);
});
