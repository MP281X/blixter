#!/bin/bash

# run db migration
atlas schema fmt ../packages/db/schema.hcl;
atlas schema clean --auto-approve -u $POSTGRES_URL;
atlas schema apply --auto-approve -u $POSTGRES_URL --to file://../packages/db/schema.hcl;

# generate the db client
npx kysely-codegen --dialect postgres --out-file ../packages/db/index.g.d.ts --url $POSTGRES_URL;

# run the seed script
bun ../packages/db/seed.ts
