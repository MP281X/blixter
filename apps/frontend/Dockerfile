FROM node:20-bookworm-slim
ENV NODE_ENV production
WORKDIR /app

# copy the package.json
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json

# copy the node_modules
COPY node_modules ./node_modules
COPY apps/frontend/node_modules ./apps/frontend/node_modules

# copy the build output
COPY apps/frontend/build ./apps/frontend/build

# run the app
ENV HOST 0.0.0.0
ENV PORT 3000
CMD [ "node", "/app/apps/frontend/build" ]
