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

If you see `Cannot find module './897.js'` or `prerender-manifest.json` missing, the `.next` cache is corrupted (common on Windows if `build` runs while `dev` is still open):

```bash
npm run dev:clean
```

Open [http://localhost:3000](http://localhost:3000).

## Build (static export)

```bash
npm run build
```

Output: `out/`

```bash
docker build -t mbs-studio-web:staging .
# prod :
docker build -t mbs-studio-web:prod .
```

## Kubernetes

| Env | Namespace | Host |
|-----|-----------|------|
| staging | `mbs-studio-staging` | `mbs.nafuralabs.staging` |
| prod | `mbs-studio-prod` | **`http://mbs.nafuralabs.com`** (HTTP only, pas de TLS) |

Manifestes : `deploy/k8s/`

## Deploy

Depuis la racine `nafuralabs` :

```bash
# staging (Docker Desktop K8s)
ENV=staging bash toolchain/ops/nlops.sh onboard-app mbs-studio

# prod (GKE nafura-prod)
kubectl config use-context gke_gen-lang-client-0875291215_europe-west9_nafura-prod
ENV=prod bash toolchain/ops/nlops.sh deploy mbs-studio
```

Prérequis prod : infra bootstrappée (`ENV=prod bash toolchain/ops/nlops.sh bootstrap-env`).

Pour GKE prod, taguer et pousser vers Artifact Registry puis mettre à jour
`deploy/k8s/overlays/prod/kustomization.yaml` (`images.newName`).

## DNS

```
mbs.nafuralabs.com  A  34.163.148.251
```

(même IP que `sektor.nafuralabs.com` — LoadBalancer ingress nginx)

Accès : **http://mbs.nafuralabs.com** (HTTP uniquement, pas de certificat TLS).

## Replace placeholders

| Asset | Path |
|-------|------|
| Logo | `public/logo.svg`, `public/logo-white.svg` |
| Hero lettering | `public/hero/fragment-*.svg` |
| CTA lettering | `public/hero/cta-*.svg` |
| Project images | `lib/projects.ts` or `public/projects/` |

## Desktop interactions

- Custom pencil cursor (GSAP `quickTo`)
- Draw on empty areas (canvas overlay)
- Circle + `mix-blend-mode: difference` on project hover
- Drag project cards; click opens `/projects/[slug]`

Mobile: standard cursor, stacked projects, tap to open.
