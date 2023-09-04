#!/bin/bash

# load env
source .env && clear;

# run db migration
atlas schema fmt schema.hcl;
atlas schema clean --auto-approve -u $POSTGRES_URL;
atlas schema apply --auto-approve -u $POSTGRES_URL --to file://schema.hcl;

# generate the db client
npx kysely-codegen --dialect postgres --out-file ./index.g.d.ts --url $POSTGRES_URL;

# run the seed script
bun ./seed.ts
