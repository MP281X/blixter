# Blixter

Blixter in an open-source streaming platform that i created to improve my frontend and backend skills and knowledge

It's a typescript monorepo that use `typescript` for the backend and `sveltekit` for the frontend

It's deployed on a self-hosted `k3s` cluster an it's powered by the `bun` javascript runtime

It relies on `postgres` as the primary db and `redis` for the cache, pub-sub and queues.

The files are stored on minio, an S3 compatible object storage

## Running Locally

#### Environment Configuration (.env)

To run Blixter locally, create a `.env` file with these environment variables:

```sh
REDIS_URL=redis://{host}:{port}
POSTGRES_URL=postgresql://{username}:{password}@{host}:{port}/blixter?sslmode=disable
S3_KEY=
S3_SECRET=
SALT=
```

#### Starting the Projects

```sh
bun install         # install the project dependency
bun run dev         # run the projects in development mode
bun run preview     # simulate production mode
```

## Project structure

```sh
├── .github/        # GitHub Actions Configuration
├── app/            # Applications
├── k8s/            # Kubernetes Manifests
├── packages/       # Shared Code
├── scripts/        # Scripts
└── task-runner.ts  # Task runner
```

## Task Runner

The Task Runner script is a versatile tool:

- It locates and runs scripts specified in the cli args for each project (if the project has that script).
- It handles log formatting, code checks with `prettier`, code generation, and project linting with `tsc`.
- In development mode, it runs all apps in parallel and triggers the code generation scripts when specified files change. It also applies Prettier code formatting and regenerates generated or cached files.
- In test mode, it runs the .test.ts file specified in the script arguments.
- In other modes, it run the code generation on startup, checks TypeScript types with TSC, ensures code formatting with Prettier and reports errors if tasks fail.
