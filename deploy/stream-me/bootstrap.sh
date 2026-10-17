#!/usr/bin/env bash
set -euo pipefail

public_ip="${1:?Usage: ./bootstrap.sh PUBLIC_IP}"
umask 077

if [[ ! -f .env ]]; then
  api_key="streamme_$(openssl rand -hex 8)"
  api_secret="$(openssl rand -hex 32)"
  cat > .env <<EOF
LIVEKIT_API_KEY=${api_key}
LIVEKIT_API_SECRET=${api_secret}
LIVEKIT_PUBLIC_URL=ws://${public_ip}:7880
EOF
fi

set -a
source .env
set +a

cat > livekit.yaml <<EOF
port: 7880
log_level: info
keys:
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}
rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true
EOF
chmod 600 .env livekit.yaml

docker compose up -d --build
