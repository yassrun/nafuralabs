# NafuraLabs

Monorepo Nafura — platform, produits, infra.

## Documentation

| Priorité | Document |
|----------|----------|
| **Agents IA** | **[docs/AGENTS.md](docs/AGENTS.md)** — référence canonique |
| Ops K8s | [toolchain/ops/AGENTS.md](toolchain/ops/AGENTS.md) |
| Vue humaine | [docs/README.md](docs/README.md) |

## Démarrage rapide (staging)

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging \
  bash toolchain/ops/nlops.sh release-app sektor-btp
```

```powershell
.\gradlew.bat :sektor:app:bootJar
cd products/sektor-btp/web && npm run build:staging
```

## Produits

| Produit | Chemin |
|---------|--------|
| Sektor BTP (ERP) | [products/sektor-btp/](products/sektor-btp/) |
| MBS Studio | [marketing/products/mbs-studio/](marketing/products/mbs-studio/) |
| Zenith | [marketing/products/zenith/](marketing/products/zenith/) |
| Corporate | [marketing/corporate/](marketing/corporate/) |
| Venue Catalog | [products/venue-catalog/](products/venue-catalog/) |
| Layali / Beauty | [products/layali/](products/layali/), [products/beauty/](products/beauty/) |

Legacy : `nf/nafura` — ne plus développer.
