FROM node:20-bookworm-slim
ENV NODE_ENV production
WORKDIR /app

# copy the package.json
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/jobs-handler/package.json ./apps/jobs-handler/package.json

# copy the node_modules
COPY node_modules ./node_modules
COPY apps/jobs-handler/node_modules ./apps/jobs-handler/node_modules

# copy the build output
COPY apps/jobs-handler/dist ./apps/jobs-handler/dist

# run the app
CMD [ "node", "/app/apps/jobs-handler/dist" ]
