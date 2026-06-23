# Import des libs partagées — backend & frontend

Guide monorepo : [README.md](README.md).


## Principe

| Couche | Emplacement | Mécanisme d’import |
|--------|-------------|-------------------|
| Platform backend | `platform/backend/` | Gradle `project("...")` |
| Platform frontend | `platform/web/` | TypeScript `paths` (`@platform/*`) |
| Métier partagé (plus tard) | `shared/business/<name>/` | Gradle `project(...)` — seulement au 2ᵉ consommateur |
| Métier produit | `products/<app>/backend/modules/` | Gradle interne au produit |

Pas de Maven Central / npm registry pour la platform en dev : tout compile **dans un seul multi-projet Gradle** et **un workspace Angular par app** (ou un workspace racine multi-projets).

---

## Backend — Gradle multi-projet (racine `nafuralabs/`)

### Arborescence (identique à nafura pour la platform, nouveaux chemins pour les apps)

```
nf/nafuralabs/
├── settings.gradle.kts          # inclut platform + produits
├── build.gradle.kts             # Java 21, Spring Boot BOM, Lombok…
├── gradle.properties
│
├── platform/backend/
│   ├── core/framework/
│   ├── core/authorization/
│   ├── features/collaboration/doc-manager/
│   └── …
│
└── products/venue-catalog/backend/
    ├── app/                     # :products:venue-catalog:app — bootJar
    └── modules/
        ├── api/
        ├── catalog-place/
        └── catalog-job/
```

### `settings.gradle.kts` (extrait)

Les chemins Gradle restent **stables** (`:platform:core:framework`) pour faciliter la copie depuis `nafura` :

```kotlin
rootProject.name = "nafuralabs"

// ── Platform (copié depuis nafura/backend/platform) ──
include(":platform:core:framework")
project(":platform:core:framework").projectDir = file("platform/backend/core/framework")

include(":platform:core:authorization")
project(":platform:core:authorization").projectDir = file("platform/backend/core/authorization")

// … autres modules platform nécessaires

// ── Produit venue-catalog ──
include(":products:venue-catalog:app")
project(":products:venue-catalog:app").projectDir = file("products/venue-catalog/backend/app")

include(":products:venue-catalog:api")
project(":products:venue-catalog:api").projectDir = file("products/venue-catalog/backend/modules/api")
```

### Dépendances dans le boot app (`products/venue-catalog/backend/app/build.gradle.kts`)

```kotlin
dependencies {
    // Platform — uniquement ce dont le produit a besoin
    implementation(project(":platform:core:framework"))
    implementation(project(":platform:core:authorization"))
    implementation(project(":platform:core:identity"))
    implementation(project(":platform:features:collaboration:doc-manager"))

    // Modules métier du produit
    implementation(project(":products:venue-catalog:api"))
    implementation(project(":products:venue-catalog:catalog-place"))

    implementation("org.springframework.boot:spring-boot-starter-web")
    // …
}
```

### Module métier → platform

```kotlin
// products/venue-catalog/backend/modules/catalog-place/build.gradle.kts
dependencies {
    implementation(project(":platform:core:framework"))
    api(project(":platform:integrations:storage"))  // si module platform
}
```

### Règles backend

1. **Les modules `platform/*` ne dépendent jamais d’un `products/*`.**
2. **Les modules métier d’un produit ne dépendent pas du `app` boot** (hexagonal).
3. **`shared/business/*`** (futur) : même pattern que platform, ajouté dans `settings.gradle.kts` quand 2 apps en ont besoin.
4. **Compilation :** depuis la racine : `./gradlew :products:venue-catalog:app:bootJar`

### Alternative écartée (solo) : artifacts publiés

Publier `platform-*` sur Maven/GH Packages imposerait versionning + CI publish à chaque changement platform. À envisager seulement si repo platform séparé ou équipe multiple.

---

## Frontend — TypeScript path aliases vers `platform/web/`

### Arborescence

```
nf/nafuralabs/
├── platform/web/                    # copié depuis nafura/web/app/platform
│   ├── core/
│   ├── features/
│   └── …
│
└── products/venue-catalog/web/      # app Angular du produit
    ├── src/main.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    └── app/                         # pages, routes, services métier
```

### `products/venue-catalog/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@platform/*": ["../../../platform/web/*"],
      "@core/*": ["../../../platform/web/core/*"],
      "@features/*": ["../../../platform/web/features/*"],
      "@env": ["./src/environments/environment"]
    }
  }
}
```

### Usage dans le code produit

```typescript
import { ListingPageComponent } from '@platform/core/components/listing';
import { AuthService } from '@core/security/auth.service';
import { PlaceSearchFacade } from '../app/catalog/search/place-search.facade';
```

Même convention que `nafura/web/tsconfig.json` — seuls les chemins relatifs changent (`../../../platform/web`).

### Build Angular

**Option A (recommandée au début) :** un `angular.json` **par produit** dans `products/<app>/web/`.

**Option B :** workspace racine `nafuralabs/web/angular.json` avec plusieurs `projects` pointant vers chaque `products/*/web`. Utile quand plusieurs apps front partagent la même config CI.

Dans les deux cas, `platform/web` n’est **pas** une lib npm packagée : le bundler résout les alias au build.

### Shell platform sans couplage ERP

`platform/web` ne doit importer **aucun** fichier sous `products/*`.  
Le menu, routes et widgets spécifiques vivent dans `products/<app>/web/app/`.

---

## `shared/business/` (futur)

Quand Beauty et Sektor partagent par ex. `partner` :

```
shared/business/partner/     # Gradle java-library
```

```kotlin
// settings.gradle.kts
include(":shared:business:partner")
project(":shared:business:partner").projectDir = file("shared/business/partner")

// products/beauty/backend/app/build.gradle.kts
implementation(project(":shared:business:partner"))
```

Pas d’équivalent front obligatoire : souvent chaque app a sa UI même si le backend est partagé.

---

## Copie depuis `nafura` — checklist imports

| Étape | Action |
|-------|--------|
| 1 | Copier `nafura/backend/platform` → `nafuralabs/platform/backend` |
| 2 | Copier `nafura/web/app/platform` → `nafuralabs/platform/web` |
| 3 | Créer `settings.gradle.kts` racine avec `include` + `projectDir` |
| 4 | Remplacer `implementation project(':domains:…')` par modules sous `products/<app>/backend/modules/` |
| 5 | Configurer `tsconfig` paths vers `../../../platform/web` |
| 6 | Retirer imports ERP du shell platform |

---

## Résumé

> **Backend :** un Gradle multi-projet à la racine de `nafuralabs` — `implementation(project(":platform:…"))` et `implementation(project(":products:venue-catalog:…"))`.  
> **Frontend :** alias TypeScript `@platform/*` → `platform/web/`.  
> **Pas de registry** en phase solo ; **pas de dépendance** `nafura` → `nafuralabs` ou l’inverse.
