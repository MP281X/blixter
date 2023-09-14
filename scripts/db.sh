#!/bin/bash

DEPLOYMENTS=("redis" "postgres" "cp-kafka")
for deployment in "${DEPLOYMENTS[@]}"; do
    # Delete the deployment
    kubectl delete deployment "$deployment" -n blixter
    
    # Wait for the pod restart
    while true; do
        if kubectl get pods -n blixter | grep "$deployment" | grep -q "1/1"; then
            echo "$deployment: running"
            break
        else
            echo "$deployment: restarting"
            sleep 5
        fi
    done
done

sleep 10

# run db migration
atlas schema fmt ../packages/db/schema.hcl;
atlas schema clean --auto-approve -u $POSTGRES_URL;
atlas schema apply --auto-approve -u $POSTGRES_URL --to file://../packages/db/schema.hcl;

# generate the db client
npx kysely-codegen --dialect postgres --out-file ../packages/db/index.g.d.ts --url $POSTGRES_URL;

# run the seed script
bun ../packages/db/seed.ts
