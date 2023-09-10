FROM oven/bun
ENV NODE_ENV production
WORKDIR /app

# copy the dependency
COPY bun.lockb ./
COPY apps/frontend/package.json ./
COPY node_modules ./node_modules

# copy the build output
COPY apps/frontend/build ./build

# run the app
ENV HOST 0.0.0.0
ENV PORT 3000
CMD [ "bun", "./build" ]
