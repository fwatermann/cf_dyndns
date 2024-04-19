FROM node:lts-alpine as build-stage

WORKDIR /app

COPY package*.json /app/

RUN npm ci && npm install typescript --location=global

COPY ./ /app/

RUN tsc

RUN rm -rf /app/node_modules
RUN npm install --omit=dev --production

## Create Image

FROM node:lts-alpine

WORKDIR /app

COPY --from=build-stage /app/node_modules /app/node_modules
COPY --from=build-stage /app/build /app/

ENV NODE_ENV=production

EXPOSE 2021

CMD node start.js