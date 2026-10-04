# Ops Nafura — lancer et déployer

> Pour les agents comme pour les humains. Un seul lanceur par produit du host ; `nlops.sh` reste pour l’infra partagée et les produits hors host (Sektor, vitrines, venue-catalog).

## Prérequis (Windows, Git Bash)

- JDK et Node du projet : `deps/jdk-25*`, `deps/node-v22*` (versions : `nafura-platform/stack.versions.properties`). `run.mjs` trouve le JDK tout seul.
- `export PATH=/c/nf/nafuralabs/deps/node-v22.22.3-win-x64:$PATH` puis `node.exe` (avec `node`, Git Bash répond « stdout is not a tty » dans un pipe).
- Staging : Docker Desktop avec Kubernetes ; fichier hosts : `<id>.nafuralabs.staging` et `iam.nafuralabs.staging` → `127.0.0.1` (`powershell -File nafura-platform/ops/add-staging-hosts.ps1`, admin).

## Produits du host : quatre modes, une commande

```bash
node <produit>/ops/run.mjs lab                      # back + front locaux, PostgreSQL embarqué, utilisateurs lab : aucune infra
node <produit>/ops/run.mjs local-staging            # back + front locaux sur la base du staging, sélecteur d’utilisateurs lab
node <produit>/ops/run.mjs staging [--scope=back|front] [--dry-run]
node <produit>/ops/run.mjs prod    [--scope=back|front] [--dry-run] [--yes]
node nafura-platform/scripts/nafura.mjs new <id> --name "<Nom>"     # nouveau produit
```

| Mode | Ce qui tourne | Connexion | Prêt quand |
|---|---|---|---|
| `lab` | API `spec.local.ports.api`, web `spec.local.ports.web` | sélecteur d’utilisateurs lab (`spec.local.users`) | le journal affiche `<Nom> is up:` |
| `local-staging` | idem, base du staging en port-forward | sélecteur d’utilisateurs lab (`spec.local.users`) | idem ; `staging` lancé au moins une fois |
| `staging` | pods dans `<id>-staging` (Docker Desktop) | Keycloak staging | `rollout status` OK puis réponse HTTP |
| `prod` | pods dans `<id>-prod` (VPS OVH, images poussées au registry) | Keycloak prod | idem ; confirmation demandée |

`staging` et `prod` enchaînent : contrôles (Docker, contexte kubectl, infra prête) → images backend, migrations, web → premier passage : namespace, base et rôle PostgreSQL dédiés, client Keycloak du produit, comptes des propriétaires (`spec.deploy.<env>.owners`, mot de passe temporaire affiché une fois) → Job de migrations → déploiement → rollouts → vérification HTTP.

### Règles pour les agents

1. Lancer `lab` en arrière-plan avec sortie dans un fichier (`node.exe ops/run.mjs lab > /tmp/lab.log 2>&1`) et attendre `is up:` ; une seule instance à la fois (ports du manifeste). Arrêt : tuer le terminal, puis `taskkill //F //IM java.exe` et `postgres.exe` si besoin.
2. Session lab pour tester l’API : `POST /api/public/lab/session {"email":"…"}` → `accessToken` ; organisation et rôles : `GET /api/v1/me/session`.
3. `prod` : toujours `--dry-run` d’abord ; jamais `--yes` sans demande explicite. Ne jamais écrire un mot de passe temporaire dans un fichier.
4. Un changement de déploiement commun va dans `nafura-platform/ops/product/` (k8s base + surcharges staging/prod, Dockerfiles, `run.mjs` + `run.test.mjs`). `<produit>/ops/k8s/<env>/` ne porte que des patches propres au produit. Jamais de script ops dans un produit.
5. Contexte kubectl : `docker-desktop` (staging) et `nafura-vps-prod` (prod) par défaut, `KUBE_CONTEXT` sinon ; un contexte prod est refusé pour staging et inversement.
6. Lab mode : pas de données métier en prod (hors vitrines) ; on peut réinitialiser une base lab (`<produit>/sources/backend/data/postgres`, supprimer avec `cmd //c "rmdir /s /q …"`).

### Configuration par environnement

| Clé | lab | cluster (`local-staging`, `staging`, `prod`) |
|---|---|---|
| Base | embarquée, migrée au démarrage | infra, migrée par le Job, validée au démarrage |
| Connexion | `nafura.lab.*` | Keycloak sur les pods ; `local-staging` réactive `nafura.lab.*` (même liste) |
| Propriétaires | — | `NAFURA_OWNERS` ← `spec.deploy.<env>.owners` |
| Données de démo des BCs | oui | `NAFURA_SEED_DEMO` : `true` en staging, refusé en prod |

Configuration commune : `nafura-platform/gradle/host/application.yml` et `application-cluster.yml`.

## Vérifications avant de rendre la main

```bash
cd nafura-platform/sources/web && npm run -s architecture:check
cd nafura-platform/sources/backend && JAVA_HOME=/c/nf/nafuralabs/deps/jdk-25.0.4.1+1 ./gradlew :platform:host-tests:test --no-daemon --max-workers=1
node <produit>/ops/run.mjs staging --dry-run          # si l’ops a changé
```

## Infra partagée et produits hors host — `nlops.sh`

Jusqu’à `sektor-sur-host`, Sektor, venue-catalog et les vitrines (MBS, corporate) se déploient par `nafura-platform/ops/nlops.sh` (et `make -C nafura-platform/ops help`).

| Besoin | Commande |
|---|---|
| Nouveau cluster : infra (PostgreSQL, Keycloak, MinIO, Vault, Gotenberg) + secrets | `KUBE_CONTEXT=docker-desktop ENV=staging bash nafura-platform/ops/nlops.sh bootstrap-env` (fichier `ops/secrets/nafura.secrets`, voir [secrets/README.md](secrets/README.md)) |
| Recharger les secrets Vault | `ENV=staging bash nafura-platform/ops/nlops.sh vault-seed` |
| Sektor staging | `make -C nafura-platform/ops stg-up SCOPE=full\|back\|front APP=sektor-btp` |
| Sektor prod | `REGISTRY_PASS=*** make -C nafura-platform/ops prod-up SCOPE=… APP=sektor-btp` |
| Diagnostic | `bash nafura-platform/ops/nlops.sh preflight` |

Environnements : `staging` = Docker Desktop (`nafura-infra-staging`), `prod` = VPS OVH k3s (`nafura-infra-prod`, registry `54.36.183.106:30500/nafura`). `demo` (GKE) n’existe plus.
