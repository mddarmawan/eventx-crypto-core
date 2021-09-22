FROM node:14 as base

RUN mkdir -p /home/node/app
WORKDIR /home/node/app

# Install app dependencies
COPY package.json /home/node/app/
RUN npm install

# Bundle app source
COPY . /home/node/app

FROM base as production

ENV NODE_PATH=./build

RUN npm run build
