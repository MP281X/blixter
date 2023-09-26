# K8S

This folder contains all the manifest used by K3S and ArgoCD to manage
the kubernetes resources

```sh
├── frontend        # frontend
├── job-handler     # jobs-hanlder
├── kustomization   # define what yaml file to use (the argocd-image-updater needs it)
├── minio           # s3 compatible storage
├── namespace       # namespace for the k8s resources
├── postgres        # single node postgres (with persistance)
├── redis           # single node redis (no persistance)
└── secrets         # secrets file used by the SealedSecrets controller to generate the secrets
```
