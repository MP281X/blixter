#!/bin/bash

printf "%s
#? postgres
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: postgres
  namespace: blixter
  annotations: { sealedsecrets.bitnami.com/cluster-wide: 'true' }
spec:
  encryptedData:
    POSTGRES_DB: $(echo -n "blixter" | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    POSTGRES_USER: $(echo -n $K8S_POSTGRES_USER | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    POSTGRES_PASSWORD: $(echo -n $K8S_POSTGRES_PASSWORD | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)

---
#? minio
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: minio
  namespace: blixter
  annotations: { sealedsecrets.bitnami.com/cluster-wide: 'true' }
spec:
  encryptedData:
    MINIO_ROOT_USER: $(echo -n $K8S_S3_KEY | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    MINIO_ROOT_PASSWORD: $(echo -n $K8S_S3_SECRET | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)

---
#? job-handler
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: job-handler
  namespace: blixter
  annotations: { sealedsecrets.bitnami.com/cluster-wide: 'true' }
spec:
  encryptedData:
    REDIS_URL: $(echo -n $K8S_REDIS_URL | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    POSTGRES_URL: $(echo -n $K8S_POSTGRES_URL | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    S3_KEY: $(echo -n $K8S_S3_KEY | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    S3_SECRET: $(echo -n $K8S_S3_SECRET | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    SALT: $(echo -n $K8S_SALT | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)

---
#? frontend
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: frontend
  namespace: blixter
  annotations: { sealedsecrets.bitnami.com/cluster-wide: 'true' }
spec:
  encryptedData:
    REDIS_URL: $(echo -n $K8S_REDIS_URL | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    POSTGRES_URL: $(echo -n $K8S_POSTGRES_URL | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    S3_KEY: $(echo -n $K8S_S3_KEY | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    S3_SECRET: $(echo -n $K8S_S3_SECRET | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)
    SALT: $(echo -n $K8S_SALT | tr -d '\r' | kubeseal --controller-name=sealed-secrets --raw --scope cluster-wide)

" > ../k8s/secrets.yaml
