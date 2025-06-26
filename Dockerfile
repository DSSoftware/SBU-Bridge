FROM node:22.12.0-alpine AS builder

#set basedir
WORKDIR /app 

# make base update and install libs + git
RUN apk update && apk add build-base g++ cairo-dev pango-dev giflib-dev git

# clone repo to enable dc deployment
RUN git clone https://github.com/DSSoftware/SBU-Bridge.git /app

# Install pnpm and install all dependencies
RUN npm install -g pnpm \
    && pnpm install

CMD [ "node", "index.js" ]
