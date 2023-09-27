FROM oven/bun:alpine
ENV NODE_ENV production
WORKDIR /app

# install ffmpeg
RUN apk add ffmpeg

# copy the build output
COPY apps/jobs-handler/build/index.js ./index.js

# run the app
CMD [ "bun", "index.js" ]
