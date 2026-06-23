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

## Docker & deploy (dev / prod)

From repo root, use the infra script:

```bash
cd infra/scripts

# Dev (nafuralabs.local): build and deploy
./nafuralabs.sh build-deploy dev

# Prod (nafuralabs.com): build and deploy
./nafuralabs.sh build-deploy prod
```

Or split build and deploy:

```bash
./nafuralabs.sh build dev
./nafuralabs.sh deploy dev

./nafuralabs.sh build prod
./nafuralabs.sh deploy prod
```

With a container registry (e.g. for prod CI):

```bash
REGISTRY=ghcr.io/yourorg ./nafuralabs.sh build prod   # build and push
REGISTRY=ghcr.io/yourorg ./nafuralabs.sh deploy prod   # deploy using registry image
```

Ensure `127.0.0.1 nafuralabs.local` is in your hosts file for dev (see `infra/scripts/setup.sh`).

## Environments

| Environment | Host |
|-------------|------|
| Local       | http://nafuralabs.local |
| Production  | https://nafuralabs.com  |

Ingress and deployment are defined in `infra/k8s/` (base + overlays/infra/<env> + overlays/apps/<app>/<env>).
