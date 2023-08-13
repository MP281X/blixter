FROM node:18-alpine
WORKDIR /app

# copy the build and the package.json
COPY ./package.json /app/package.json
COPY ./node_modules /app/node_modules
COPY ./build /app/build

ENV port 3000
ENV NODE_ENV production
CMD [ "node", "build" ]
