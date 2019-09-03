FROM node:10.15.3-alpine
WORKDIR /opt/simulator

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python bash

COPY package*.json /opt/simulator/

RUN npm install --quiet node-gyp -g &&\
  npm install --quiet --production
RUN apk del native-deps

COPY src /opt/simulator/src

EXPOSE 8444
CMD ["node", "./src/index.js"]
