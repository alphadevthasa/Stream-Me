import assert from 'node:assert/strict';
import test from 'node:test';
import {createParticipantToken} from './token.mjs';

function decodePayload(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

test('broadcaster token can publish in the requested room', async () => {
  const token = await createParticipantToken({
    room: 'streamme-demo',
    identity: 'host-android',
    role: 'broadcaster',
    apiKey: 'devkey',
    apiSecret: 'secret',
  });
  const payload = decodePayload(token);

  assert.equal(payload.sub, 'host-android');
  assert.equal(payload.video.room, 'streamme-demo');
  assert.equal(payload.video.canPublish, true);
  assert.equal(payload.video.canSubscribe, true);
});

test('viewer token can subscribe but cannot publish', async () => {
  const token = await createParticipantToken({
    room: 'streamme-demo',
    identity: 'viewer-ios',
    role: 'viewer',
    apiKey: 'devkey',
    apiSecret: 'secret',
  });
  const payload = decodePayload(token);

  assert.equal(payload.sub, 'viewer-ios');
  assert.equal(payload.video.room, 'streamme-demo');
  assert.equal(payload.video.canPublish, false);
  assert.equal(payload.video.canSubscribe, true);
});

test('rejects unsupported participant roles', async () => {
  await assert.rejects(
    createParticipantToken({
      room: 'streamme-demo',
      identity: 'unknown',
      role: 'admin',
      apiKey: 'devkey',
      apiSecret: 'secret',
    }),
    /Unsupported LiveKit role/,
  );
});
