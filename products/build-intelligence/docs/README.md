# Nafura Build Intelligence

Produit multi-tenant de connaissance BTP intégré au monorepo NafuraLabs.

## Modules

- `documents` : import et stockage des documents de connaissance
- `extraction` : pipeline IA multimodale, validation et revue humaine
- `catalog` : ouvrages, clauses et observations de prix
- `retrieval` : recherche hybride sourcée
- `generation` : génération contrôlée BPU/DQE
- `integrations-sektor` : pont API vers Sektor Études

## Déploiement

```bash
BUILD_IMAGES=true ENV=staging KUBE_CONTEXT=docker-desktop bash toolchain/ops/nlops.sh onboard-app build-intelligence
```

## API principale

- `POST /api/v1/build-intelligence/documents/upload`
- `POST /api/v1/build-intelligence/documents/{id}/analyze`
- `GET /api/v1/build-intelligence/review/items`
- `GET /api/v1/build-intelligence/catalog/work-items`
- `GET /api/v1/build-intelligence/search?q=`
- `POST /api/v1/build-intelligence/generation/bpu`
- `POST /api/v1/build-intelligence/integrations/sektor/etudes/import/{workItemId}`
