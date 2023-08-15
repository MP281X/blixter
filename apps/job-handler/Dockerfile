FROM node:18-alpine
WORKDIR /app

# copy the build and the package.json
COPY ./package.json /app/package.json
COPY ./node_modules /app/node_modules
COPY ./dist /app/dist

ENV NODE_ENV production
CMD [ "node", "dist" ]
