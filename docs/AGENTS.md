# NafuraLabs — référence agents IA

**Document canonique** du monorepo. Lire en premier avant toute modification code, ops ou doc.

| Besoin | Document |
|--------|----------|
| Ops K8s (deploy, migrate, reset, troubleshooting) | [toolchain/ops/AGENTS.md](../toolchain/ops/AGENTS.md) |
| Imports Gradle / TypeScript | [PLATFORM_IMPORTS.md](PLATFORM_IMPORTS.md) |
| Table migration `nf/nafura` → chemins actuels | [ARCHITECTURE_MIGRATION.md](ARCHITECTURE_MIGRATION.md) |
| Secrets Vault | [VAULT_SECRETS.md](VAULT_SECRETS.md) |
| Fichier secrets local (bootstrap) | [secrets/README.md](../secrets/README.md) |
| Vue humaine courte | [README.md](README.md) |

---

## Règles impératives

1. **Un seul monorepo** (`nafuralabs`) — ne pas splitter platform + Sektor tant qu’ils partagent Gradle/TS.
2. **Environnement = cluster**, pas branche Git — `ENV=staging|prod` + `KUBE_CONTEXT`, jamais de branche `staging`/`prod`.
3. **Ops** : toujours `toolchain/ops/nlops.sh` ou `make` — pas de `kubectl apply` ad hoc sauf debug.
4. **Migrations** : Job Liquibase **avant** backend (`release-app`, pas `deploy` seul après changement SQL).
5. **Métier** uniquement sous `products/<app-id>/` — jamais dans `platform/`.
6. **Pas de codegen** JSON (`nafgen`, `nafspec`, `nafops`).
7. **Legacy** `nf/nafura` : ne plus modifier sauf hotfix prod avant bascule.
8. **Ne pas committer** de secrets ; fichier local `secrets/nafura.secrets` (voir [secrets/README.md](../secrets/README.md)).

---

## Modèle monorepo

```
platform/          SDK partagé (auth, tenancy, UI shell) — aucun métier
products/<app>/    Code + deploy K8s par produit
infra/k8s/         Infra partagée (postgres, keycloak, vault…) — overlays par ENV
marketing/         Sites vitrine (MBS, corporate)
products/<app>/web/  Workspace Angular du produit (autonome : angular.json + package.json)
platform/web/      Bibliotheques front partagees (core, lib, features) - consomme par chemins tsconfig
toolchain/ops/     nlops.sh — CLI deploy
```

**Infra** : déployée **1× par cluster** (`bootstrap-env`).  
**Produits** : déployés **indépendamment** (`release-app <app>`).

---

## Git & releases

| Principe | Détail |
|----------|--------|
| Branche principale | `main` — source de vérité |
| Branches de travail | `feat/<scope>`, `fix/<scope>` — courtes, merge via PR |
| Pas de branche par env | staging/prod = clusters K8s, pas Git |
| Promotion prod | Même commit `main` (ou tag) → `ENV=prod` + `PUSH_IMAGES=true` |
| Découpage PR | 1 PR = 1 périmètre : `products/sektor-btp`, `platform/`, `infra/k8s`, `marketing/` |

### Quel deploy après merge ?

| Paths modifiés | Action staging |
|----------------|----------------|
| `products/sektor-btp/**`, `platform/**` | `release-app sektor-btp` |
| `infra/k8s/**` | `infra-up` puis vérifier apps |
| `marketing/products/mbs-studio/**` | `deploy mbs-studio` |
| `marketing/corporate/**` | `deploy corporate` |
| `toolchain/ops/**` | pas de deploy cluster |

**CI/CD GitHub Actions** : non implémenté — deploy manuel via `nlops.sh` (roadmap).

---

## Environnements

| `ENV` | Cluster | `KUBE_CONTEXT` | Infra NS | Images |
|-------|---------|----------------|----------|--------|
| `staging` | Docker Desktop K8s | `docker-desktop` | `nafura-infra-staging` | locales `:staging` |
| `prod` | OVH VPS k3s | `nafura-vps-prod` | `nafura-infra-prod` | registry VPS `:prod` |

Registry prod : `54.36.183.106:30500/nafura` — public TLS : `registry.nafuralabs.com`

Pas d’overlay K8s `dev`. Env `demo` (GKE) : **deprecated**.

---

## Produits déployables

| App ID | Namespace | DB | Migrations | Overlay K8s |
|--------|-----------|-----|------------|-------------|
| `sektor-btp` | `sektor-${ENV}` | `nafura_erp` | Liquibase Job | `products/sektor-btp/deploy/k8s/overlays/${ENV}` |
| `venue-catalog` | `venue-catalog-${ENV}` | `nafura_venue_catalog` | Flyway startup | `products/venue-catalog/deploy/k8s/overlays/${ENV}` |
| `build-intelligence` | `build-intelligence-${ENV}` | `nafura_build_intelligence` | Liquibase Job | `products/build-intelligence/deploy/k8s/overlays/${ENV}` |
| `usage-ops` | `usage-ops-${ENV}` | `nafura_usage_ops` | Liquibase Job | `products/usage-ops/deploy/k8s/overlays/${ENV}` |
| `mbs-studio` | `nafura-vitrine-${ENV}` | — | — | `marketing/products/mbs-studio/deploy/k8s/overlays/${ENV}` |
| `corporate` | `nafura-vitrine-${ENV}` | — | — | `marketing/corporate/deploy/k8s/overlays/${ENV}` |

Layali / Beauty : `products/*/mobile/` — hors K8s pour l’instant.

Gradle Sektor : `:sektor:app`, `:sektor:<module>`.

**Frontend — Sektor possede son front, la plateforme n'en depend jamais.**

```
platform/web/               core/ lib/ features/  — ZERO import applicatif
products/sektor-btp/web/    angular.json, package.json, src/, app/
package.json (racine)       manifeste de workspaces npm — hisse node_modules
```

| Alias | Cible |
|-------|-------|
| `@core/*`, `@lib/*`, `@platform/*`, `@features/*` | `platform/web/` |
| `@app/*` | `products/sektor-btp/web/app/` |

**Direction de dependance : application -> plateforme, jamais l'inverse.** La plateforme
declare ce dont elle a besoin (`core/application/application-config.ts`,
`core/integrations/audit.port.ts`, `core/shell/shell-extensions.ts`) et l'application le
fournit au demarrage. Regle ESLint dans `products/sektor-btp/web/.eslintrc.json`.

`node_modules` est hisse a la racine par les workspaces npm : `platform/web/` vit hors du
repertoire produit, donc la resolution Node doit pouvoir remonter jusqu'a lui.
`platform/web/package.json` declare ses dependances reelles en `peerDependencies`.

Historique du chantier : [`products/sektor-btp/docs/epics/front-ownership/`](../products/sektor-btp/docs/epics/front-ownership/00-REVUE-ARCHI.md).

---

## Hostnames

### Staging (`*.nafuralabs.staging` — fichier hosts local → `127.0.0.1`)

| Rôle | Host |
|------|------|
| Sektor web | `sektor.nafuralabs.staging` |
| Sektor API | `api.sektor.nafuralabs.staging` |
| IAM | `iam.nafuralabs.staging` |
| MBS | `mbs.nafuralabs.staging` |
| Usage Ops | `usage-ops.nafuralabs.staging` |
| Minio / S3 / Vault | `minio`, `s3`, `vault`.nafuralabs.staging |

Hosts Windows (admin) : `powershell -ExecutionPolicy Bypass -File toolchain/ops/add-staging-hosts.ps1`

### Prod (`*.nafuralabs.com` — DNS public → VPS `54.36.183.106`)

| Rôle | Host |
|------|------|
| Sektor | `sektor.nafuralabs.com`, `api.sektor.nafuralabs.com` |
| IAM | `iam.nafuralabs.com` |
| MBS | `mbs.nafuralabs.com` |
| Usage Ops | `usage-ops.nafuralabs.com` |

Config front : `products/sektor-btp/web/src/environments/environment.staging.ts` / `environment.prod.ts`.

---

## Où mettre le code

| Tâche | Chemin |
|-------|--------|
| Domaine ERP (stock, chantiers…) | `products/sektor-btp/backend/modules/<domaine>/` |
| Boot app Sektor | `products/sektor-btp/backend/app/` |
| UI ERP | `products/sektor-btp/web/app/` |
| Auth, listing, shell UI | `platform/web/` ou `platform/backend/` |
| Specs produit | `products/<app-id>/docs/` |
| Manifests produit | `products/<app-id>/deploy/k8s/` — **pas** sous `infra/k8s/` |
| Infra partagée | `infra/k8s/overlays/infra/${ENV}/` |
| Nouveau produit | Copier pattern `sektor-btp` → `onboard-app` |

`shared/business/` : uniquement si **2 produits** réutilisent le même module métier.

---

## Ops — commandes essentielles

Toujours depuis la **racine du repo** :

```bash
KUBE_CONTEXT=<ctx> ENV=<env> bash toolchain/ops/nlops.sh <commande> [app]
```

| Intent | Commande |
|--------|----------|
| Diagnostic | `preflight` |
| Nouveau cluster | `secrets/nafura.secrets` → `clean-env` → `bootstrap-env` → `onboard-app <app>` |
| Re-seed Vault (fichier local) | `vault-seed` |
| Release complète | `release-app <app>` (+ `BUILD_IMAGES=true`) |
| Backend + SQL | `release-backend <app>` |
| Frontend seul | `release-frontend <app>` |
| Infra seule | `infra-up` |
| Prod + images | `BUILD_IMAGES=true PUSH_IMAGES=true REGISTRY_PASS=… release-app <app>` |

Staging Sektor (quotidien) :

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

Arbre de décision complet : [toolchain/ops/AGENTS.md](../toolchain/ops/AGENTS.md).

---

## Interdit

| Action | Raison |
|--------|--------|
| Namespaces `nafura-erp-dev`, `nafura-infra`, `default` pour infra | Legacy |
| `kubectl apply -f` hors kustomize overlay env | Drift |
| Deploy backend sans `migrate` après changement SQL | CrashLoop |
| Métier BTP dans `platform/` | Architecture |
| Overlay K8s `dev` | Seulement staging + prod |
| Importer une application depuis `platform/web/` | Dependance inversee — interdite par ESLint. Passer par un jeton d'injection ou un emplacement de shell |
| Hostnames `*.nafura.local` en staging cluster | Remplacés par `*.nafuralabs.staging` (dev local `ng serve` peut garder `.local`) |

---

## Dette connue

- Shell platform couplé à Sektor via `@applications/*` — à découpler au 2ᵉ produit front.
- Docs historiques `web/docs/` : chemins `app/applications/erp` → lire `products/sektor-btp/web/app/`.
- CI/CD automatisé : à implémenter (build PR → deploy staging → deploy prod manuel).

---

## Checklist post-merge (agent)

- [ ] Changement SQL → `migrate` / `release-backend`, pas `deploy` seul
- [ ] Changement `environment.*.ts` ou ingress → rebuild image web
- [ ] Changement `infra/k8s` → `infra-up` + rollout keycloak si hostname IAM
- [ ] Staging validé avant `ENV=prod`
- [ ] `preflight` + `kubectl get pods -n <ns>` après deploy

---

*Dernière mise à jour : 2026-07 — monorepo, OVH VPS prod, hostnames `*.nafuralabs.staging`.*
