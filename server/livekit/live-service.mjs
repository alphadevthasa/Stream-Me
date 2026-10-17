import {randomUUID} from 'node:crypto';
import {createParticipantToken} from './token.mjs';

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  response.end(body);
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  if (body.length > 4096) throw new Error('Request body is too large');
  return body ? JSON.parse(body) : {};
}

export function createLiveHandler({rooms, apiKey, apiSecret, serverUrl, makeId = randomUUID}) {
  async function getSessions() {
    const liveRooms = await rooms.listRooms();
    const sessions = [];
    for (const room of liveRooms) {
      if (!room.name.startsWith('streamme-')) continue;
      const isLegacyDemo = room.name === 'streamme-demo';
      const id = isLegacyDemo ? 'demo' : room.name.slice('streamme-'.length);
      const participants = await rooms.listParticipants(room.name);
      const hostIdentity = isLegacyDemo ? 'host-android' : `host-${id}`;
      const host = participants.find(participant => participant.identity === hostIdentity);
      if (!host) continue;
      sessions.push({
        id,
        room: room.name,
        creatorName: host.name || 'Kreator Stream Me',
        viewers: Math.max(0, participants.length - 1),
      });
    }
    return sessions;
  }

  return async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (request.method === 'GET' && url.pathname === '/health') return sendJson(response, 200, {ok: true});

    try {
      if (request.method === 'POST' && url.pathname === '/live/sessions') {
        const body = await readJson(request);
        const id = makeId();
        const room = `streamme-${id}`;
        const creatorName = typeof body.creatorName === 'string' && body.creatorName.trim()
          ? body.creatorName.trim().slice(0, 40)
          : 'Kreator Stream Me';
        const token = await createParticipantToken({
          room, identity: `host-${id}`, role: 'broadcaster', name: creatorName, apiKey, apiSecret,
        });
        return sendJson(response, 201, {id, room, creatorName, role: 'broadcaster', token, serverUrl});
      }

      if (request.method === 'GET' && url.pathname === '/live/sessions') {
        return sendJson(response, 200, await getSessions());
      }

      const tokenMatch = url.pathname.match(/^\/live\/sessions\/([a-zA-Z0-9-]+)\/token$/);
      if (request.method === 'POST' && tokenMatch) {
        const id = tokenMatch[1];
        const sessions = await getSessions();
        const session = sessions.find(item => item.id === id);
        if (!session) return sendJson(response, 409, {error: 'Siaran ini sudah berakhir.'});
        const token = await createParticipantToken({
          room: session.room, identity: `viewer-${makeId()}`, role: 'viewer', name: 'Penonton', apiKey, apiSecret,
        });
        return sendJson(response, 200, {id, room: session.room, role: 'viewer', token, serverUrl});
      }

      if (request.method === 'GET' && url.pathname === '/live/status') {
        const sessions = await getSessions();
        return sendJson(response, 200, {
          live: sessions.length > 0,
          viewers: sessions.reduce((total, session) => total + session.viewers, 0),
        });
      }
      return sendJson(response, 404, {error: 'Not found'});
    } catch (error) {
      console.error('Live request failed:', error.message);
      return sendJson(response, 503, {error: 'Live service is not ready'});
    }
  };
}
