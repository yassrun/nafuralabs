# NafuraLabs

Monorepo Nafura — produits, platform, infra.

**→ Commencer par [docs/README.md](docs/README.md)** (vision, structure, maintenance).

## Démarrage rapide

```powershell
cd C:\nf\nafuralabs
.\gradlew.bat :sektor:app:bootJar
```

```powershell
cd web
npm install
npm run build:prod
```

```bash
make deploy-sektor ENV=staging
# ou
make deploy APP=sektor-btp ENV=staging
```

## Produits

| Produit | Chemin | Statut |
|---------|--------|--------|
| Sektor BTP (ERP) | [products/sektor-btp/](products/sektor-btp/) | migré |
| Venue Catalog | [products/venue-catalog/](products/venue-catalog/) | specs / wp-01 à implémenter |

## Documentation

| Doc | Sujet |
|-----|-------|
| [docs/README.md](docs/README.md) | **Guide mère** |
| [toolchain/ops/README.md](toolchain/ops/README.md) | Ops K8s : bootstrap env vs deploy produit |
| [docs/PLATFORM_IMPORTS.md](docs/PLATFORM_IMPORTS.md) | Imports Gradle / TypeScript |
| [docs/ARCHITECTURE_MIGRATION.md](docs/ARCHITECTURE_MIGRATION.md) | Migration depuis nafura |
| [docs/AGENTS.md](docs/AGENTS.md) | Règles agents IA |

## Legacy

`nf/nafura` — archive, ne plus développer.
