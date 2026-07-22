# NafuraLabs — guide du monorepo

**Agents IA** → lire d’abord **[AGENTS.md](AGENTS.md)** (référence canonique).

| Document | Contenu |
|----------|---------|
| [AGENTS.md](AGENTS.md) | **Référence agents** — monorepo, git, envs, deploy, interdits |
| [toolchain/ops/AGENTS.md](../toolchain/ops/AGENTS.md) | Ops K8s détaillé (`nlops.sh`) |
| [PLATFORM_IMPORTS.md](PLATFORM_IMPORTS.md) | Gradle + TypeScript paths |
| [ARCHITECTURE_MIGRATION.md](ARCHITECTURE_MIGRATION.md) | Chemins `nf/nafura` → `nafuralabs` |
| [VAULT_SECRETS.md](VAULT_SECRETS.md) | Arborescence secrets |

---

## Vision

- **Un monorepo** : platform partagée + produits autonomes (`products/<app-id>/`).
- **Code et Markdown** font foi — pas de JSON spec / codegen.
- **Deux environnements** : `staging` (Docker Desktop K8s) et `prod` (OVH VPS k3s).
- **Legacy** `nf/nafura` : archive, ne plus développer.

---

## Arborescence (résumé)

```
platform/           SDK (backend Gradle + web Angular)
products/           Sektor, venue-catalog, layali, beauty…
infra/k8s/          Postgres, Keycloak, Vault, ingress
marketing/          Sites vitrine
web/                Workspace Angular Sektor
toolchain/ops/      nlops.sh
```

Détail « où mettre quoi » : [AGENTS.md § Où mettre le code](AGENTS.md#où-mettre-le-code).

---

## Environnements & hostnames

| Env | Cluster | Sektor web | IAM |
|-----|---------|------------|-----|
| staging | Docker Desktop | `sektor.nafuralabs.staging` | `iam.nafuralabs.staging` |
| prod | OVH VPS | `sektor.nafuralabs.com` | `iam.nafuralabs.com` |

Namespaces : `nafura-infra-${ENV}`, `sektor-${ENV}`, `nafura-vitrine-${ENV}`.

Hosts staging local : [toolchain/ops/README.md](../toolchain/ops/README.md#hostnames-staging).

---

## Démarrage rapide

```bash
# Cycle de vie (préféré)
make stg-up SCOPE=full APP=sektor-btp              # build + pods staging
make dev-up SCOPE=front APP=sektor-btp             # front local → infra staging
REGISTRY_PASS=*** make prod-up SCOPE=full APP=sektor-btp   # après OK staging

# Équivalent bas niveau staging
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging \
  bash toolchain/ops/nlops.sh release-app sektor-btp
```

```powershell
# Build local (hors cycle pods)
.\gradlew.bat :sektor:app:bootJar
cd products\sektor-btp\web && npm run build:staging
```

---

## Produits

| Produit | Chemin | Statut |
|---------|--------|--------|
| Sektor BTP | [products/sektor-btp/](../products/sektor-btp/) | production |
| MBS Studio | [marketing/products/mbs-studio/](../marketing/products/mbs-studio/) | vitrine |
| Corporate | [marketing/corporate/](../marketing/corporate/) | vitrine |
| Venue Catalog | [products/venue-catalog/](../products/venue-catalog/) | specs |
| Layali / Beauty | [products/layali/](../products/layali/), [products/beauty/](../products/beauty/) | mobile P1 |

---

## Ajouter un produit

1. `products/<app-id>/` avec `deploy/k8s/overlays/{staging,prod}/`
2. Enregistrer dans `settings.gradle.kts` si backend Java
3. `ENV=staging bash toolchain/ops/nlops.sh onboard-app <app-id>`

Voir [AGENTS.md](AGENTS.md) pour le modèle complet.
