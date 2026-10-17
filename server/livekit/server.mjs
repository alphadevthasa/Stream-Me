import {createServer} from 'node:http';
import {RoomServiceClient} from 'livekit-server-sdk';
import {createLiveHandler} from './live-service.mjs';

const port = Number(process.env.LIVE_TOKEN_PORT ?? 3001);
const serverUrl = process.env.LIVEKIT_PUBLIC_URL ?? process.env.LIVEKIT_URL ?? 'ws://127.0.0.1:7880';
const apiKey = process.env.LIVEKIT_API_KEY ?? 'devkey';
const apiSecret = process.env.LIVEKIT_API_SECRET ?? 'secret';

const adminUrl = new URL(process.env.LIVEKIT_URL ?? serverUrl);
adminUrl.protocol = adminUrl.protocol === 'wss:' ? 'https:' : 'http:';
const rooms = new RoomServiceClient(adminUrl.toString(), apiKey, apiSecret);
const server = createServer(createLiveHandler({rooms, apiKey, apiSecret, serverUrl}));

server.listen(port, '0.0.0.0', () => {
  console.log(`Stream Me Live service listening on 0.0.0.0:${port}`);
  console.log(`LiveKit server: ${serverUrl}`);
});
