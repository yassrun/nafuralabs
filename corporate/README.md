# Nafura Labs — Marketing Website

Modern marketing site for Nafura Labs. Built with Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Local development

```bash
cd sources/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & run (production)

```bash
npm run build
npm start
```

Runs on port 3000.

## Docker & deploy (OVH VPS prod)

Manifests: `ops/k8s/`

Shared infra runs in `nafura-infra-prod` on the OVH VPS k3s cluster (`nafura-vps-prod`).

```bash
# From nafuralabs root
kubectl config use-context nafura-vps-prod

BUILD_IMAGES=true PUSH_IMAGES=true KUBE_CONTEXT=nafura-vps-prod ENV=prod \
  REGISTRY_PASS=<secret> bash nafura-platform/ops/nlops.sh build-push corporate

KUBE_CONTEXT=nafura-vps-prod ENV=prod bash nafura-platform/ops/nlops.sh deploy corporate
```

## Environments

| Environment | Cluster | Namespace | Host |
|-------------|---------|-----------|------|
| prod | OVH VPS k3s (`nafura-vps-prod`) | `nafura-vitrine-prod` | `nafuralabs.com`, `www.nafuralabs.com` |

Registry: `54.36.183.106:30500/nafura/corporate-web:prod`

Porte : [NAFURALABS.md](../NAFURALABS.md). Deploy : [nafura-platform/ops/AGENTS.md](../nafura-platform/ops/AGENTS.md).
