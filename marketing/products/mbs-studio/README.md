# MBS Studio — site vitrine

Site vitrine **Mr. Big Stuff Studio** (Next.js static export → nginx).

**Emplacement monorepo :** `marketing/products/mbs-studio/`

## Stack

- Next.js 15 (App Router, `output: 'export'`)
- React 19, TypeScript
- Tailwind CSS 4
- GSAP + ScrollTrigger
- HTML5 Canvas (session drawing on desktop)

## Development

```bash
cd marketing/products/mbs-studio
npm install
node scripts/generate-hero-svgs.mjs   # placeholder hero/CTA fragments
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build (static export)

```bash
npm run build
docker build -t mbs-studio-web:prod .
```

## Kubernetes

| Env | Namespace | Host |
|-----|-----------|------|
| prod | `nafura-vitrine-prod` | `mbs.nafuralabs.com` |

Manifestes : `deploy/k8s/`

## Deploy (OVH VPS prod)

Depuis la racine `nafuralabs` :

```bash
kubectl config use-context nafura-vps-prod

BUILD_IMAGES=true PUSH_IMAGES=true KUBE_CONTEXT=nafura-vps-prod ENV=prod \
  REGISTRY_PASS=<secret> bash toolchain/ops/nlops.sh build-push mbs-studio

KUBE_CONTEXT=nafura-vps-prod ENV=prod bash toolchain/ops/nlops.sh deploy mbs-studio
```

Prérequis : infra bootstrappée (`nafura-infra-prod` — postgres, keycloak, vault, etc.).

Registry : `54.36.183.106:30500/nafura/mbs-studio-web:prod`

## DNS

```
mbs.nafuralabs.com  A  54.36.183.106
```
