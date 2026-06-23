# NafuraLabs — guide du monorepo

Document **mère** : vision, structure, navigation, maintenance quotidienne.  
À lire en premier. Les autres docs du dossier `docs/` détaillent des sujets précis.

| Document | Contenu |
|----------|---------|
| **Ce fichier** | Vision, arborescence, workflows |
| [ARCHITECTURE_MIGRATION.md](ARCHITECTURE_MIGRATION.md) | Historique migration depuis `nf/nafura` |
| [PLATFORM_IMPORTS.md](PLATFORM_IMPORTS.md) | Gradle + TypeScript : lier platform ↔ produits |
| [AGENTS.md](AGENTS.md) | Règles pour agents IA / contributeurs |

---

## 1. Vision

**NafuraLabs** est le monorepo unique de Nafura :

- chaque **produit** (Sektor, futurs Beauty / Layali…) est **autonome** : code métier, déploiement, docs ;
- seule la **platform** est partagée : auth, tenancy, composants UI, doc-manager, etc. ;
- **pas de JSON spec** ni de codegen (`nafgen`, `nafspec`, `nafops`) — le **code** et le **Markdown** font foi ;
- **deux environnements** : `staging` (cluster K8s local) et `prod` (GKE) ;
- un module métier partagé (`shared/business/`) **uniquement** quand deux produits en ont besoin.

**Legacy :** `nf/nafura` reste en archive jusqu’à bascule prod complète. Ne plus y développer.

---

## 2. Arborescence

```
nf/nafuralabs/
│
├── docs/                          ← vous êtes ici
│
├── platform/                      # SDK technique (aucun métier)
│   ├── backend/                   # modules Gradle Java (:platform:*)
│   └── web/                       # shell Angular, anatomy, features
│
├── products/                      # produits déployables
│   ├── sektor-btp/                # ERP BTP (Sektor) — en prod
│   └── venue-catalog/             # catalogue lieux — specs, code à venir
│       ├── docs/                  # specs produit (Markdown)
│       └── README.md
│
├── web/                           # workspace Angular (point d’entrée build Sektor)
│   ├── src/                       # main.ts, environments
│   ├── app/                       # app.component, app.config, routes (pas de métier ici)
│   └── package.json
│
├── marketing/
│   └── corporate/                 # site nafuralabs.com (Next.js)
│
├── infra/
│   ├── k8s/                       # postgres, redis, minio, keycloak, vault
│   └── keycloak/themes/
│
├── shared/
│   └── business/                  # vide — modules métier partagés plus tard
│
├── toolchain/ops/
│   ├── nlops.sh                   # bootstrap-env, onboard-app, deploy, …
│   └── README.md                  # infra 1× / env vs deploy produit
│
├── tools/lifecycle/               # collecte migrations SQL → Liquibase
├── settings.gradle.kts            # inclut platform + produits
├── build.gradle.kts
├── Makefile
└── README.md
```

### Où mettre quoi ?

| Je travaille sur… | Dossier |
|-------------------|---------|
| Compta, chantiers, stock… | `products/sektor-btp/backend/modules/<domaine>/` |
| Onboarding, config app ERP | `products/sektor-btp/backend/app/` |
| Écran ERP, facades Angular | `products/sektor-btp/web/app/` |
| Auth, listing générique, shell | `platform/web/` ou `platform/backend/` |
| Catalogue lieux, jobs Google | `products/venue-catalog/backend/modules/` (à créer) |
| Specs produit | `products/<app-id>/docs/` |
| Nouveau produit | `products/<app-id>/` (copier le pattern sektor-btp) |
| Postgres, Keycloak | `infra/k8s/` |
| Site vitrine | `marketing/corporate/` ou `marketing/products/<marque>/` |

---

## 3. Namespaces & environnements

L’**environnement = le cluster** (pas un suffixe dans le nom du namespace).

| Env | Cluster | Usage |
|-----|---------|-------|
| `staging` | Docker Desktop K8s / k3d | dev quotidien, intégration |
| `prod` | GKE | clients |

| Namespace K8s | Contenu |
|---------------|---------|
| `nafura-infra` | postgres, redis, minio, keycloak, vault, ingress |
| `nafura-sektor` | backend + frontend Sektor |
| `nafura-venue-catalog` | venue-catalog backend (futur) |
| `nafura-marketing` | site corporate (futur) |

**Postgres :** une instance par cluster, une base par app. Sektor → `nafura_erp`.

### Hostnames Sektor (ERP)

| Env | Web | API |
|-----|-----|-----|
| `staging` | `sektor.nafuralabs.staging` | `api.sektor.nafuralabs.staging` |
| `prod` | `sektor.nafuralabs.com` | `api.sektor.nafuralabs.com` |

Ingress : `products/sektor-btp/deploy/k8s/overlays/<env>/`.

---

## 4. Imports code

### Backend (Gradle)

```kotlin
// Dans products/sektor-btp/backend/app/build.gradle
implementation(project(":platform:core:framework"))
implementation(project(":sektor:chantiers"))
```

Modules Gradle :

- platform → `:platform:core:framework`, `:platform:features:…`
- métier Sektor → `:sektor:item`, `:sektor:stock`, …

Détail : [PLATFORM_IMPORTS.md](PLATFORM_IMPORTS.md).

### Frontend (TypeScript)

Configuré dans `web/tsconfig.json` :

| Alias | Cible |
|-------|-------|
| `@platform/*` | `platform/web/*` |
| `@applications/*` | `products/sektor-btp/web/app/*` |
| `@core/*` | `platform/web/core/*` |

**Règle :** `platform/web` ne doit pas importer de fichiers sous `products/*` sauf via `@applications/*` (couplage Sektor à découpler progressivement).

---

## 5. Workflows quotidiens

### Ops — modèle infra / produit

L’**infra partagée** (`nafura-infra`) se déploie **une fois par environnement** (nouveau cluster staging ou prod).  
Les **produits** se déploient **indépendamment** sur cette infra déjà en place.

| Étape | Quand | Commande |
|-------|--------|----------|
| Bootstrap env | 1× par cluster | `ENV=staging bash toolchain/ops/nlops.sh bootstrap-env` |
| Premier produit | 1× par app + env | `ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp` |
| Release produit | souvent | `ENV=staging bash toolchain/ops/nlops.sh deploy sektor-btp` |
| Upgrade infra | rare | `ENV=staging bash toolchain/ops/nlops.sh infra-up` |

Via Make : `make bootstrap-env ENV=staging`, `make onboard-app APP=sektor-btp`, `make deploy APP=sektor-btp`.

Détail : [toolchain/ops/README.md](../toolchain/ops/README.md).

### Backend

```powershell
cd C:\nf\nafuralabs
.\gradlew.bat :sektor:app:compileJava
.\gradlew.bat :sektor:app:bootJar
.\gradlew.bat :tools:lifecycle:collectMigrations -PappId=sektor-btp
```

### Frontend

```powershell
cd C:\nf\nafuralabs\web
npm install
npm run start:erp          # dev local
npm run build:prod         # build production
```

### Ops (staging) — exemple Sektor

```bash
# Une seule fois sur un nouveau cluster staging :
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# Première fois pour Sektor :
ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# Releases suivantes (infra déjà en place) :
ENV=staging bash toolchain/ops/nlops.sh deploy sektor-btp
```

Ou via Make : `make bootstrap-env`, `make deploy APP=sektor-btp ENV=staging`.

### Image Docker backend

```bash
docker build -t sektor-btp-backend:staging -f products/sektor-btp/Dockerfile .
```

---

## 6. Ajouter un nouveau produit

1. Créer `products/<app-id>/` avec `backend/app`, `web/app`, `deploy/k8s/overlays/{staging,prod}/`.
2. Enregistrer les modules dans `settings.gradle.kts`.
3. Sur un env existant : `ENV=staging bash toolchain/ops/nlops.sh onboard-app <app-id>`.
4. Specs produit en **Markdown** dans `products/<app-id>/docs/`.
5. N’extraire vers `shared/business/` que si un **deuxième** produit réutilise le même module.

Ne pas ajouter de manifests produit sous `infra/k8s/` — infra partagée uniquement.

---

## 7. Maintenance — règles

### À faire

- Corriger les bugs platform dans `platform/` — envisager le portage si `nafura` legacy encore en prod.
- Tenir `docs/` à jour quand la structure change.
- Migrations SQL dans `src/main/resources/db/` de chaque module.
- Déployer staging avant prod.

### À ne pas faire

- Rajouter des fichiers sous `naf/src/spec/` ou du codegen JSON.
- Mettre du métier BTP dans `platform/`.
- Créer un overlay K8s `dev` (staging + prod seulement).
- Dupliquer du code sous `web/app/applications/` — la source ERP est `products/sektor-btp/web/app/`.

### Dette connue

- Le shell platform importe encore des composants Sektor via `@applications/*` — à isoler quand un 2ᵉ produit front arrive.
- Docs historiques dans `web/docs/` mentionnent parfois l’ancien chemin `app/applications/erp` — lire `@applications/*` → `products/sektor-btp/web/app/`.

---

## 8. Carte rapide Gradle

| Module | Chemin disque |
|--------|---------------|
| `:sektor:app` | `products/sektor-btp/backend/app` |
| `:sektor:chantiers` | `products/sektor-btp/backend/modules/chantiers` |
| `:platform:core:framework` | `platform/backend/core/framework` |
| `:tools:lifecycle` | `tools/lifecycle` |

Lister tous les projets : `.\gradlew.bat projects`

---

## 9. Liens produit

- [Sektor BTP README](../products/sektor-btp/README.md)
- [Venue Catalog README](../products/venue-catalog/README.md)
- [Marketing corporate](../marketing/corporate/README.md)

---

## 10. Schéma logique

```
                    ┌─────────────────────────────────────┐
                    │           nafura-infra              │
                    │  postgres · redis · minio · keycloak │
                    └──────────────┬──────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
  nafura-sektor            nafura-venue-catalog      nafura-marketing
  sektor-btp-backend       (futur)                   nafuralabs.com
  sektor-btp-web
         │
         │  dépend de
         ▼
  platform/backend + platform/web
  (framework, auth, UI shell, …)
```

---

*Dernière mise à jour : migration Sektor complète, nettoyage doublons `web/app/`.*
