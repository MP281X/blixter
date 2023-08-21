#!/bin/bash

# List of file/folder to delete
files_to_delete=(
    "node_modules"
    ".turbo"
    "dist"
    ".sveltekit"
    "build"
    "*.g.ts"
)

# delete file/folder
for name in "${files_to_delete[@]}"; do
    find . -type f -name "$name" -exec rm -f {} +
    find . -type d -name "$name" -exec rm -rf {} +
done

pnpm install
npx turbo daemon clean
