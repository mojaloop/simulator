FROM node:16.15.0-alpine as builder
WORKDIR /opt/app

RUN apk --no-cache add git
RUN apk add --no-cache -t build-dependencies make gcc g++ python3 libtool libressl-dev openssl-dev autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package*.json /opt/app/

RUN npm ci

FROM node:16.15.0-alpine
WORKDIR /opt/app

# Create a non-root user: ml-user
RUN adduser -D ml-user 
USER ml-user

COPY --chown=ml-user --from=builder /opt/app .
RUN npm prune --production

COPY src /opt/app/src

EXPOSE 8444
CMD ["npm", "run", "start"]
