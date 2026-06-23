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
```

## Produits

| Produit | Chemin |
|---------|--------|
| Sektor BTP (ERP) | [products/sektor-btp/](products/sektor-btp/) |

## Documentation

| Doc | Sujet |
|-----|-------|
| [docs/README.md](docs/README.md) | **Guide mère** |
| [docs/PLATFORM_IMPORTS.md](docs/PLATFORM_IMPORTS.md) | Imports Gradle / TypeScript |
| [docs/ARCHITECTURE_MIGRATION.md](docs/ARCHITECTURE_MIGRATION.md) | Migration depuis nafura |
| [docs/AGENTS.md](docs/AGENTS.md) | Règles agents IA |

## Legacy

`nf/nafura` — archive, ne plus développer.
