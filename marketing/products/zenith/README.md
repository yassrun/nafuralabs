# Zenith — site vitrine

Site vitrine **Zenith** (Next.js static export → nginx).

**Emplacement monorepo :** `marketing/products/zenith/`

## Stack

- Next.js 15 (App Router, `output: 'export'`)
- React 19, TypeScript
- Tailwind CSS 4
- GSAP + ScrollTrigger
- HTML5 Canvas (session drawing on desktop)

## Development

```bash
cd marketing/products/zenith
npm install
node scripts/generate-hero-svgs.mjs   # placeholder hero/CTA fragments
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build (static export)

```bash
npm run build
docker build -t zenith-web:prod .
```

## Kubernetes

| Env | Namespace | Host |
|-----|-----------|------|
| staging | `nafura-vitrine-staging` | `zenith.nafuralabs.staging` |
| prod | `nafura-vitrine-prod` | `zenith.nafuralabs.com` |

Manifestes : `deploy/k8s/`

## Deploy (OVH VPS prod)

Depuis la racine `nafuralabs` :

```bash
kubectl config use-context nafura-vps-prod

BUILD_IMAGES=true PUSH_IMAGES=true KUBE_CONTEXT=nafura-vps-prod ENV=prod \
  REGISTRY_PASS=<secret> bash toolchain/ops/nlops.sh build-push zenith

KUBE_CONTEXT=nafura-vps-prod ENV=prod bash toolchain/ops/nlops.sh deploy zenith
```

Prérequis : infra bootstrappée (`nafura-infra-prod`).

Registry : `54.36.183.106:30500/nafura/zenith-web:prod`

## DNS

Staging local (Docker Desktop K8s) — ajouter dans `C:\Windows\System32\drivers\etc\hosts` :

```
127.0.0.1 zenith.nafuralabs.staging
```

Ou exécuter : `powershell -ExecutionPolicy Bypass -File toolchain/ops/add-staging-hosts.ps1` (admin).

Prod :

```
zenith.nafuralabs.com  A  54.36.183.106
```
