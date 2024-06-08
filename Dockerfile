FROM node:18.19.0-alpine as builder

COPY src ./src
COPY config ./config
COPY package*.json ./
COPY tsconfig*.json ./
COPY datasource.config.ts ./
COPY .npmrc ./

RUN npm ci; npm run build

FROM node:18.19.0-alpine

COPY --from=builder dist ./dist
COPY --from=builder config ./config
COPY --from=builder package*.json ./
COPY --from=builder .npmrc ./

RUN node --version && npm --version
RUN npm ci --production

CMD ["npm", "run", "start:prod"]
