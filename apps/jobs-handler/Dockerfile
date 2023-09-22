FROM oven/bun
ENV NODE_ENV production
WORKDIR /app

# install ffmpeg
RUN apt update -y && apt install -y ffmpeg

# copy the build output
COPY apps/jobs-handler/build/index.js ./index.js

# run the app
CMD [ "bun", "index.js" ]
