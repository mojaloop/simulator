FROM node:10.15.1-alpine

WORKDIR /opt/simulators
#COPY logs /opt/simulators/logs

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python 


COPY package*.json /opt/simulators/

RUN npm install --quiet node-gyp -g &&\
  npm install --quiet --production

RUN apk del native-deps

COPY src /opt/simulators/src


# Create empty log file
#RUN touch ./logs/combined.log

# Link the stdout to the application log file
#RUN ln -sf /dev/stdout ./logs/combined.log

EXPOSE 8444
CMD ["node", "./src/index.js"]
