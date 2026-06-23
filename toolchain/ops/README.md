# Nafura ops (`nlops.sh`)

Séparation **infra partagée** (une fois par environnement/cluster) et **produits** (déployables indépendamment).

## Environnements

| `ENV` | Cluster |
|-------|---------|
| `staging` | Docker Desktop K8s / k3d |
| `prod` | GKE |

L'environnement = le cluster. Les namespaces (`nafura-infra`, `nafura-sektor`, …) sont identiques ; seul le cluster change.

## Bootstrap d'un nouvel environnement (1×)

Déploie Postgres, Redis, MinIO, Keycloak, Vault, ingress dans `nafura-infra` :

```bash
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env
```

Relancer `bootstrap-env` / `infra-up` uniquement pour une **montée de version infra** ou un **nouveau cluster** — pas à chaque release produit.

## Premier déploiement d'un produit

```bash
ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp
```

Enchaîne : `provision-db` → `migrate` → `deploy`.

Prérequis : `products/<app-id>/deploy/k8s/overlays/<env>/` doit exister.

## Release produit (quotidien)

```bash
ENV=staging bash toolchain/ops/nlops.sh deploy sektor-btp
```

Ne touche **pas** à l'infra partagée.

## Commandes

| Commande | Quand |
|----------|-------|
| `bootstrap-env` | Nouveau cluster staging ou prod |
| `infra-up` | Idem sans attente rollout (bas niveau) |
| `onboard-app <app>` | Première fois qu'un produit arrive sur un env |
| `provision-db <app>` | Créer la base Postgres dédiée |
| `migrate <app>` | Liquibase (sektor) ou note Flyway (venue-catalog) |
| `deploy <app>` | Appliquer le manifeste K8s produit |

## Makefile

```bash
make bootstrap-env ENV=staging
make onboard-app APP=sektor-btp ENV=staging
make deploy APP=sektor-btp ENV=staging
```

Alias legacy : `make deploy-sektor`, `make provision-db-sektor`, …

## Bases de données

| App | Base |
|-----|------|
| `sektor-btp` | `nafura_erp` |
| `venue-catalog` | `nafura_venue_catalog` |

Instance Postgres unique par cluster (`nafura-infra`).
