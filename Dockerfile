FROM node:20.18.0-alpine AS builder

WORKDIR /app

COPY src ./src
COPY config ./config
COPY package*.json ./
COPY tsconfig*.json ./
COPY datasource.config.ts ./

RUN npm ci; npm run build

FROM node:20.18.0-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config
COPY --from=builder /app/package*.json ./

RUN node --version && npm --version
RUN npm ci --production

# Uploaded files (medical data) are stored here. Mount a persistent volume on this path and include it in the
# backups, otherwise the files are lost on every deploy. Override the path with CEMEVYF_HEALTH_ORDERS_SERVICE_FILE_UPLOAD_DIR
RUN mkdir -p /app/uploadedFiles && chown node:node /app/uploadedFiles
VOLUME /app/uploadedFiles

USER node

CMD ["npm", "run", "start:prod"]
