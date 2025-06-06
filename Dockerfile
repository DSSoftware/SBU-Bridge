FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./

RUN apk update && apk add build-base g++ cairo-dev pango-dev giflib-dev

# Install pnpm and install all dependencies
RUN npm install -g pnpm \
    && pnpm install

COPY . .

CMD [ "node", "index.js" ]
