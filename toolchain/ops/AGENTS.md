# Référence ops pour agents AI — `nlops.sh`

**Document canonique** pour toute opération cluster / déploiement / migration dans ce repo.

- Script : `toolchain/ops/nlops.sh`
- Makefile : racine du repo (`make help`)
- Doc humaine : [README.md](README.md)
- Règles repo générales : [docs/AGENTS.md](../../docs/AGENTS.md)

---

## Règles impératives pour les agents

1. **Toujours** passer par `nlops.sh` ou `make` — ne pas réinventer des `kubectl apply` ad hoc sauf debug ciblé.
2. **Toujours** fixer `ENV` (`staging` | `prod` | `demo`) avant toute op.
3. **Toujours** utiliser `KUBE_CONTEXT` quand le cluster cible n’est pas le contexte kubectl par défaut :
   - Docker Desktop → `KUBE_CONTEXT=docker-desktop`
   - GKE prod/demo → contexte `gke_*` (vérifier avec `kubectl config get-contexts`)
4. **Ordre migrations** : Liquibase Job **avant** backend — utiliser `release-app` / `release-backend`, pas `deploy` seul après un changement de schéma.
5. **`clean-env` et `drop-db` sont destructifs** — ne les lancer que si l’utilisateur le demande explicitement ou après confirmation implicite (« reset complet », « nouveau cluster »).
6. **Staging = images locales** (`sektor-btp-backend:staging`). **Demo/prod = GAR** — `BUILD_IMAGES=true PUSH_IMAGES=true` obligatoire avant deploy GKE si images changées.
7. **Ne pas** utiliser les namespaces legacy (`nafura-erp-dev`, `nafura-infra`, `default` pour l’infra produit).
8. **Ne pas** committer de secrets ; ne pas modifier `.env` / credentials dans les commits.
9. Après une op, **vérifier** avec `preflight` + `kubectl get pods -n <ns>`.

---

## Matrice environnements

| `ENV` | Cluster typique | Contexte kubectl | Namespace infra | Namespace Sektor | Tag images | Registry |
|-------|-----------------|------------------|-----------------|------------------|------------|----------|
| `staging` | Docker Desktop K8s | `docker-desktop` | `nafura-infra-staging` | `sektor-staging` | `:staging` | Local Docker |
| `prod` | GKE | `gke_*_nafura-prod` | `nafura-infra-prod` | `sektor-prod` | `nafura-vitrine-prod` | `:prod` | GAR — **HTTP only**, PVC 5/2/1 Gi |
| `demo` | GKE (démo client) | `gke_*_nafura-prod` | `nafura-infra-demo` | `sektor-demo` | `:demo` | GAR |

Registry GAR par défaut :

```
europe-west9-docker.pkg.dev/gen-lang-client-0875291215/nafura
```

---

## Apps supportées

| App ID | Alias | Namespace | Base Postgres | Migrations | Overlay K8s |
|--------|-------|-----------|---------------|------------|-------------|
| `sektor-btp` | `erp` | `sektor-${ENV}` | `nafura_erp` | Liquibase (Job K8s) | `products/sektor-btp/deploy/k8s/overlays/${ENV}` |
| `venue-catalog` | — | `venue-catalog-${ENV}` | `nafura_venue_catalog` | Flyway (au startup backend) | `products/venue-catalog/deploy/k8s/overlays/${ENV}` |
| `mbs-studio` | — | `nafura-vitrine-${ENV}` | — (vitrine) | — | `marketing/products/mbs-studio/deploy/k8s/overlays/${ENV}` |
| `corporate` | — | `nafura-vitrine-${ENV}` | — (vitrine) | — | `marketing/corporate/deploy/k8s/overlays/${ENV}` |

Deployments Sektor :
- Backend : `sektor-btp-backend`
- Frontend : `sektor-btp-web`
- Job migrations : `sektor-btp-lifecycle`

Infra partagée (overlay) : `infra/k8s/overlays/infra/${ENV}`

### Vault — chemins secrets

Arbre KV : `secret/nafura/{env}/platform/...` et `secret/nafura/{env}/apps/{app-id}/...`

Référence complète : [docs/VAULT_SECRETS.md](../../docs/VAULT_SECRETS.md)

Exemples prod :
- Brevo : `platform/integrations/email/brevo` → champ `api_key`
- Gemini : `platform/integrations/ai/gemini` → champ `api_key`
- DB Sektor : `apps/sektor-btp/database`

Migration legacy : `ENV=prod bash infra/scripts/vault-migrate-platform-paths.sh`

---

## Arbre de décision — quelle commande lancer ?

```
Intent utilisateur                          → Commande
─────────────────────────────────────────────────────────────────
Nouveau cluster / tout réinstaller          → clean-env → bootstrap-env → onboard-app
Infra seulement (postgres, vault, KC…)      → bootstrap-env  (ou infra-up si déjà init)
Premier deploy d’un produit sur un env      → onboard-app <app>
Release complète (code + migrations)        → release-app <app>  [+ BUILD_IMAGES=true]
Release backend seulement                   → release-backend <app>
Release frontend seulement                  → release-frontend <app>  [+ BUILD_IMAGES=true]
Appliquer manifests sans rebuild            → deploy <app>
Migrations uniquement                       → migrate <app>
Build images sans deploy                    → build-images [app]
Push vers GAR (demo/prod)                   → push-images [app]  ou build-push
Vérifier état cluster/images                → preflight
Reset pods (garder DB)                      → reset-app <app> → release-app
Reset pods + DB vide                        → RESET_DB=true reset-app → release-app
Supprimer app du cluster                    → clean-app <app>
Créer la base seulement                     → provision-db <app>
Arrêter env GKE pour économiser             → kubectl scale (voir section coût)
```

---

## Catalogue complet des commandes

Invoque toujours depuis la **racine du repo** :

```bash
KUBE_CONTEXT=<ctx> ENV=<env> bash toolchain/ops/nlops.sh <commande> [args]
```

### Infra (cluster)

| Commande | Effet | Destructif |
|----------|-------|------------|
| `clean-env` | Supprime namespaces legacy + env courant | **Oui** |
| `bootstrap-env` | Infra + vault-init + wait services ; skip vault-init si postgres déjà ready | Non |
| `infra-up` | `kubectl apply` overlay infra | Non |
| `infra-wait` | Attend postgres/redis/minio/keycloak | Non |
| `preflight` | Diagnostic contexte, injector, infra, images | Non |

### Images

| Commande | Effet |
|----------|-------|
| `build-images [app]` | bootJar + npm build + docker (backend, web, keycloak, lifecycle pour sektor) |
| `push-images [app]` | Push GAR (no-op sur staging) |
| `build-push [app]` | Les deux |

Images Sektor produites :
- `sektor-btp-backend:${ENV}`
- `sektor-btp-web:${ENV}`
- `nafura-keycloak:${ENV}`
- `nafura-lifecycle:${ENV}`

### Base de données

| Commande | Effet | Destructif |
|----------|-------|------------|
| `provision-db <app>` | `CREATE DATABASE` sur postgres infra | Non |
| `drop-db <app>` | `DROP DATABASE` | **Oui** |
| `migrate <app>` | Gradle `collectMigrations` + Job Liquibase K8s | Non (modifie schéma) |

Credentials Postgres (staging/demo) : user/pass `nafura` / `nafura`.

### Deploy produit

| Commande | Effet |
|----------|-------|
| `deploy <app>` | Apply overlay K8s complet |
| `deploy-backend <app>` | Apply + `rollout restart` backend + wait |
| `deploy-frontend <app>` | Apply + `rollout restart` frontend + wait |
| `reset-app <app>` | Scale 0, delete jobs ; option `RESET_DB=true` |
| `clean-app <app>` | Delete namespace produit | **Oui** |

### Workflows (pipelines)

| Commande | Pipeline exact |
|----------|----------------|
| `onboard-app <app>` | `[build]` → provision-db → **migrate** → deploy |
| `release-app <app>` | `[build]` → **migrate** → deploy-backend → deploy-frontend |
| `release-backend <app>` | `[build]` → **migrate** → deploy-backend |
| `release-frontend <app>` | `[build]` → deploy-frontend |

`[build]` = seulement si `BUILD_IMAGES=true` ; push si aussi `PUSH_IMAGES=true`.

---

## Variables d’environnement

| Variable | Défaut | Usage |
|----------|--------|-------|
| `ENV` | `staging` | Environnement cible |
| `KUBE_CONTEXT` | (vide = contexte courant) | Forcer le cluster |
| `BUILD_IMAGES` | `false` | Build Docker avant release/onboard |
| `PUSH_IMAGES` | `false` | Push GAR après build |
| `RESET_DB` | `false` | Avec `reset-app`, drop + recreate DB |
| `REGISTRY` | GAR europe-west9… | Override registry |
| `GRADLEW` | `./gradlew.bat` | Gradle wrapper Windows |
| `KUBECTL_BIN` | `kubectl` | Binaire kubectl |

---

## Recettes copy-paste

### A — Nouveau cluster Docker Desktop (staging from scratch)

Prérequis : Kubernetes activé dans Docker Desktop.

```bash
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh preflight
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh clean-env
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh bootstrap-env
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp
```

Vérification :

```bash
KUBE_CONTEXT=docker-desktop kubectl get pods -n nafura-infra-staging
KUBE_CONTEXT=docker-desktop kubectl get pods -n sektor-staging
```

Hosts file (Windows) :

```
127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging iam.nafura.local
```

### B — Release quotidienne staging (infra déjà up)

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

### C — Backend seulement (changement API + migrations)

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-backend sektor-btp
```

### D — Frontend seulement

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-frontend sektor-btp
```

### E — Reset app sur cluster existant

Soft (garde les données) :

```bash
ENV=staging bash toolchain/ops/nlops.sh reset-app sektor-btp
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

Hard (DB vide) :

```bash
RESET_DB=true ENV=staging bash toolchain/ops/nlops.sh reset-app sektor-btp
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

### F — Nouveau deploy GKE demo

```bash
BUILD_IMAGES=true PUSH_IMAGES=true ENV=demo bash toolchain/ops/nlops.sh build-push sektor-btp
ENV=demo bash toolchain/ops/nlops.sh bootstrap-env
ENV=demo bash toolchain/ops/nlops.sh release-app sektor-btp
```

URLs demo (HTTP, DNS A → IP ingress) :
- `sektor-demo.nafuralabs.com`
- `api.sektor-demo.nafuralabs.com`
- `iam-demo.nafuralabs.com`

### G — GKE prod (HTTP, premiers tests)

Pas de cert-manager. PVC réduits. URLs :

- `http://sektor.nafuralabs.com`
- `http://api.sektor.nafuralabs.com`
- `http://iam.nafuralabs.com`

DNS A → IP ingress GKE (même IP que demo si même cluster).

```bash
BUILD_IMAGES=true PUSH_IMAGES=true ENV=prod bash toolchain/ops/nlops.sh build-push sektor-btp
ENV=prod bash toolchain/ops/nlops.sh bootstrap-env
ENV=prod bash toolchain/ops/nlops.sh release-app sektor-btp
```

Namespace neuf requis pour PVC réduits (on ne peut pas shrink un PVC existant).

### H — Makefile (équivalent)

```bash
make preflight ENV=staging KUBE_CONTEXT=docker-desktop
make bootstrap-env ENV=staging KUBE_CONTEXT=docker-desktop
make release-app APP=sektor-btp ENV=staging BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop
make release-backend APP=sektor-btp ENV=demo
make reset-app APP=sektor-btp ENV=staging RESET_DB=true
```

---

## Pipeline migrations (Liquibase)

Flux interne de `migrate` / `release-*` pour Sektor :

1. `./gradlew :tools:lifecycle:collectMigrations -PappId=sektor-btp`
2. Build image `nafura-lifecycle:${ENV}` si absente
3. Job K8s `<app>-lifecycle` dans le namespace produit
4. JDBC : `postgres.<infra-ns>.svc:5432/nafura_erp`
5. Attente `kubectl wait --for=condition=complete job/...`

**Ne pas** lancer le backend avant la fin du job si le changelog a changé.

Fichiers clés :
- `tools/lifecycle/Dockerfile`
- `tools/lifecycle/build/changelog/` (généré par Gradle)

---

## Troubleshooting

| Symptôme | Cause probable | Action agent |
|----------|----------------|--------------|
| `connection refused 127.0.0.1:6443` | Docker Desktop K8s off | Demander d’activer K8s dans Docker Desktop |
| Init container vault fail | vault-injector à 0 ou mauvaise addr | `bootstrap-env` (reconfigure injector) |
| `ImagePullBackOff` sur GKE | Image absente dans GAR | `BUILD_IMAGES=true PUSH_IMAGES=true build-push` |
| `ImagePullBackOff` staging | Tag local manquant | `BUILD_IMAGES=true build-images sektor-btp` |
| Backend CrashLoop après deploy | Migrations non appliquées | `migrate sektor-btp` puis `deploy-backend` |
| Keycloak not ready | Image keycloak ou vault secrets | Vérifier pods `-n nafura-infra-<env>`, rebuild keycloak |
| Job lifecycle timeout | SQL error / DB absente | `provision-db`, logs `kubectl logs job/sektor-btp-lifecycle -n sektor-<env>` |
| mauvais cluster | Contexte kubectl GKE vs local | Toujours `KUBE_CONTEXT=docker-desktop` pour staging local |
| gcloud auth error | Token expiré | `gcloud auth login` (action utilisateur) |

Commandes debug utiles :

```bash
kubectl get pods -n nafura-infra-${ENV} -o wide
kubectl get pods -n sektor-${ENV} -o wide
kubectl logs -n sektor-${ENV} deploy/sektor-btp-backend --tail=100
kubectl describe pod -n sektor-${ENV} -l app=sektor-btp-backend
kubectl logs -n sektor-${ENV} job/sektor-btp-lifecycle
```

---

## Réduction coûts GKE

Scale à 0 (ne supprime pas les PVC) :

```bash
kubectl scale deployment --all -n nafura-infra-demo --replicas=0
kubectl scale deployment --all -n sektor-demo --replicas=0
```

Relancer :

```bash
ENV=demo bash toolchain/ops/nlops.sh infra-wait   # si infra scaled up manuellement
ENV=demo bash toolchain/ops/nlops.sh release-app sektor-btp
```

---

## Chemins repo (référence rapide)

```
toolchain/ops/nlops.sh                          # CLI ops
infra/k8s/overlays/infra/{staging,prod,demo}/   # Infra K8s
products/sektor-btp/deploy/k8s/overlays/        # Sektor overlays
products/sektor-btp/Dockerfile.jar              # Backend image (rapide)
products/sektor-btp/Dockerfile.web              # Frontend image
infra/keycloak/Dockerfile                       # Keycloak custom
tools/lifecycle/                                # Liquibase collector + image
Makefile                                        # Raccourcis make
```

---

## Anti-patterns (interdits)

- `kubectl apply -f` sur des manifests bruts hors kustomize overlay env
- Deploy backend sans `migrate` après changement SQL
- Utiliser `deploy` comme substitut de `release-app` en prod
- Namespaces `nafura-erp-*`, `default` pour postgres/keycloak prod
- Outils legacy : `nafops`, `nafgen`, `nafspec`
- Modifier le monorepo legacy `nf/nafura`

---

## Checklist post-op (agent)

Après `bootstrap-env` :
- [ ] `postgres`, `redis`, `minio`, `keycloak` Running dans `nafura-infra-${ENV}`
- [ ] Job `vault-init` Completed

Après `onboard-app` / `release-app` :
- [ ] Job `sektor-btp-lifecycle` Completed (si Liquibase)
- [ ] `sektor-btp-backend` Ready (2/2 si sidecar vault)
- [ ] `sektor-btp-web` Running
- [ ] HTTP 200 sur ingress (curl avec Host header si pas de DNS local)

---

*Dernière mise à jour : aligné sur `nlops.sh` (release-app, migrate Job, KUBE_CONTEXT, env demo).*
