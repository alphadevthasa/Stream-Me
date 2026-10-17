FROM node:22-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs token.mjs live-service.mjs ./

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server.mjs"]
