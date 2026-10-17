import {AccessToken} from 'livekit-server-sdk';

export async function createParticipantToken({
  room,
  identity,
  role,
  name,
  apiKey,
  apiSecret,
}) {
  if (role !== 'broadcaster' && role !== 'viewer') {
    throw new Error(`Unsupported LiveKit role: ${role}`);
  }

  if (!room?.trim() || !identity?.trim() || !apiKey || !apiSecret) {
    throw new Error('Room, identity, API key, and API secret are required');
  }

  const token = new AccessToken(apiKey, apiSecret, {identity, name, ttl: '1h'});
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: role === 'broadcaster',
    canPublishData: role === 'broadcaster',
    canSubscribe: true,
  });

  return token.toJwt();
}
