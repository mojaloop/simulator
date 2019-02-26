FROM node:10.15.1-alpine

WORKDIR /opt/simulators
#COPY logs /opt/simulators/logs
COPY src /opt/simulators/src
COPY package.json /opt/simulators

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install --quiet node-gyp -g &&\
  npm install --quiet --production && \
  apk del native-deps

EXPOSE 8444

# Create empty log file
#RUN touch ./logs/combined.log

# Link the stdout to the application log file
#RUN ln -sf /dev/stdout ./logs/combined.log

CMD ["node", "./src/index.js"]
