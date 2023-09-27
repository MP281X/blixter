# Apps

Blixter is composed by two main applications that handle all it's functionality

```sh
├── cron-jobs    # Cronjobs
├── frontend    # Blixter frontend
└── jobs        # Jobs hanlder
```

## [cron-jobs](./cron-jobs)

The `cron-jobs` wait for the configured time and execute a task

This app handle the the failed jobs and clean unsed files and data in the db

## [frontend](./frontend)

The `frontend` application is responsible for the user interface and it interact with the db and with the cache:

- `SSR Framework`: I used `sveltekit` for server-side rendering and for building dynamic and interactive UIs.
- `Styling`: I used `tailwind` to speed up delopment and reduce maintainance time.
- `Video Playback`: The video player rely on `hls.js` play the hls secments stored in s3.

## [jobs-handler](./jobs-handler)

The `jobs-handler` wait for new entries in the `redis queue` execute the relative code.

This app handle the video conversion and the preview generation
