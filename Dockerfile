FROM node:8.11.3-alpine

WORKDIR /opt/simulators
COPY src /opt/simulators/src
COPY package.json /opt/simulators

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install --quiet node-gyp -g &&\
  npm install --quiet --production && \
  apk del native-deps

EXPOSE 8444
CMD ["node", "./src/index.js"]
