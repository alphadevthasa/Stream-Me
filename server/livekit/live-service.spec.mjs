import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import test from 'node:test';
import {createLiveHandler} from './live-service.mjs';

async function withApi(fn) {
  const state = {rooms: []};
  const roomService = {
    listRooms: async () => state.rooms,
    listParticipants: async room => state.rooms.find(item => item.name === room)?.participants ?? [],
  };
  let id = 0;
  const handler = createLiveHandler({
    rooms: roomService,
    apiKey: 'devkey',
    apiSecret: 'secret',
    serverUrl: 'ws://example.test:7880',
    makeId: () => `session-${++id}`,
  });
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn({base, state}); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('creates separate broadcaster rooms with publish tokens', async () => {
  await withApi(async ({base}) => {
    const first = await (await fetch(`${base}/live/sessions`, {method: 'POST', body: JSON.stringify({creatorName: 'Nara'})})).json();
    const second = await (await fetch(`${base}/live/sessions`, {method: 'POST', body: JSON.stringify({creatorName: 'Dian'})})).json();
    assert.notEqual(first.room, second.room);
    assert.equal(first.creatorName, 'Nara');
    const token = JSON.parse(Buffer.from(first.token.split('.')[1], 'base64url').toString());
    assert.equal(token.sub, `host-${first.id}`);
    assert.equal(token.video.room, first.room);
    assert.equal(token.video.canPublish, true);
  });
});

test('lists only rooms with a connected host and counts viewers', async () => {
  await withApi(async ({base, state}) => {
    const session = await (await fetch(`${base}/live/sessions`, {method: 'POST', body: JSON.stringify({creatorName: 'Nara'})})).json();
    state.rooms.push({name: session.room, participants: [
      {identity: `host-${session.id}`, name: 'Nara'},
      {identity: 'viewer-a', name: 'Penonton'},
    ]});
    state.rooms.push({name: 'streamme-orphan', participants: [{identity: 'viewer-b'}]});
    const response = await fetch(`${base}/live/sessions`);
    assert.deepEqual(await response.json(), [{id: session.id, room: session.room, creatorName: 'Nara', viewers: 1}]);
  });
});

test('viewer joins only the selected active room with a non-publishing identity', async () => {
  await withApi(async ({base, state}) => {
    const session = await (await fetch(`${base}/live/sessions`, {method: 'POST', body: JSON.stringify({creatorName: 'Nara'})})).json();
    const denied = await fetch(`${base}/live/sessions/${session.id}/token`, {method: 'POST'});
    assert.equal(denied.status, 409);
    state.rooms.push({name: session.room, participants: [{identity: `host-${session.id}`, name: 'Nara'}]});
    const response = await fetch(`${base}/live/sessions/${session.id}/token`, {method: 'POST'});
    const result = await response.json();
    assert.equal(result.room, session.room);
    const token = JSON.parse(Buffer.from(result.token.split('.')[1], 'base64url').toString());
    assert.match(token.sub, /^viewer-/);
    assert.equal(token.video.canPublish, false);
  });
});
