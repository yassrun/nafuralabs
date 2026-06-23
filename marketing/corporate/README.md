# Nafura Labs — Marketing Website

Modern marketing site for Nafura Labs. Built with Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Local development

```bash
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

## Docker & deploy (staging / prod)

Product manifests live under each product path, e.g. `marketing/corporate/deploy/k8s/` (when added).

Shared infra is deployed **once per cluster** via the monorepo toolchain:

```bash
# From nafuralabs root — bootstrap shared infra (Postgres, ingress, …)
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# Deploy marketing app when deploy/k8s exists:
ENV=staging bash toolchain/ops/nlops.sh onboard-app corporate
ENV=staging bash toolchain/ops/nlops.sh deploy corporate
```

See [toolchain/ops/README.md](../../toolchain/ops/README.md) and [docs/README.md](../../docs/README.md).

## Environments

| Environment | Cluster | Host (target) |
|-------------|---------|---------------|
| staging | Docker Desktop K8s | http://nafuralabs.local |
| prod | GKE | https://nafuralabs.com |

Ingress for shared infra: `infra/k8s/overlays/infra/<env>/`.
