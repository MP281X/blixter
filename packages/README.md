# Packages

This folder contains all the shared code used in the apps

None of the packages depends on the others packages

Most of the packages are type-safe wrapper simplify the interactions with other library

```sh
├── cache       # Redis json wrapper
├── db          # Kysely and Zod wrapper
├── ffmpeg      # ffmpeg wrapper
├── jobs        # Redis queue wrapper
├── realtime    # Redis pub/sub wrapper
└── s3          # AWS-S3 client wrapper
```

## [cache](./cache)

A wrapper for the `redis json` module, it's used to specify the types of the
objects stored in redis. It's also used to add, read and remove the redis keys

## [db](./db)

A wrapper for `Kysely` and `Zod`, it's used to handle the db connection and
it can generate Zod schemas based on the db schema

## [ffmpeg](./ffmpeg)

A wrapper for `ffmpeg`, it's used to execute the ffmpeg commands to extract the
informations of a video, convert a video in hls to a specific resolution and
to extract the audio from a video

## [jobs](./jobs)

It's generated based on the files in the `jobs-handler` and it's used to add
new data to the `redis queue` used by the `jobs-jandler` in a type-safe way

## [realtime](./realtime)

A wrapper for the `redis pub/sub` and for the `SSE`, it generate the handlers for the `sveltekit api
routes` and the handlers used on the frontend to receive the data in real-time

## [s3](./s3)

A wrapper for the `AWS S3 SDK`, it's used to generate the presinged url to save and
retrive objects from the frontedn. It also wrap the `fetch` api to download/upload objects from the backend
