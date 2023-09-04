FROM oven/bun
ENV NODE_ENV production
WORKDIR /app

# copy the build output
COPY ./build/index.js ./index.js

# run the app
CMD [ "bun", "index.js" ]
