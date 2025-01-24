FROM node:20.18.0-alpine AS builder

COPY src ./src
COPY config ./config
COPY package*.json ./
COPY tsconfig*.json ./
COPY datasource.config.ts ./

RUN npm ci; npm run build

FROM node:20.18.0-alpine

COPY --from=builder dist ./dist
COPY --from=builder config ./config
COPY --from=builder package*.json ./

RUN node --version && npm --version
RUN npm ci --production

CMD ["npm", "run", "start:prod"]
