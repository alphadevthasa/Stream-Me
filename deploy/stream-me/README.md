# Stream Me live backend

Bootstrap this folder on the Ubuntu host with its public IPv4 address:

```sh
./bootstrap.sh your_public_ip
```

This starts the token API on port 3001 and LiveKit on port 7880. Open inbound
TCP 3001, 7880, and 7881, plus UDP 7882, in the host and cloud firewalls.
The generated `.env` and `livekit.yaml` contain private LiveKit credentials;
keep them on the server and do not commit them.

This HTTP/WebSocket IP setup is for device testing. A production deployment
needs TLS, an authenticated creator flow, and a domain name.
