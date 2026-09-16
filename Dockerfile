# Build the client, then run the API which also serves the built site.
FROM node:22-alpine AS build
WORKDIR /app
COPY client/package*.json client/
RUN npm ci --prefix client
COPY client client
RUN npm run build --prefix client

FROM node:22-alpine
ENV NODE_ENV=production PORT=4000 DATA_DIR=/data
WORKDIR /app
COPY server/package*.json server/
RUN npm ci --prefix server --omit=dev
COPY server server
COPY --from=build /app/client/dist client/dist
VOLUME ["/data"]
EXPOSE 4000
CMD ["node", "--no-warnings=ExperimentalWarning", "server/src/index.js"]
