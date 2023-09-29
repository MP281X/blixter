FROM oven/bun:alpine
ENV TZ=Europe/Rome
ENV NODE_ENV production
WORKDIR /app

# copy the build output
COPY apps/cron-jobs/build/index.js ./index.js

# run the app
CMD [ "bun", "index.js" ]
