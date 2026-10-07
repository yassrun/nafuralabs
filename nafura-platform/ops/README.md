# Ops Nafura — lancer et déployer

> Pour les agents comme pour les humains. Un seul lanceur par produit du host ; `nlops.sh` reste pour l’infra partagée et les produits hors host (Sektor, vitrines, venue-catalog).

## Outillage : le contrat (cible)

> Décidé le 2026-10-06. **Le lab et `check` tournent sur n’importe quel poste, sans droits administrateur, sans Docker, sans rien installer sur le système.** Cible pour tout agent et tout humain ; l’état actuel et les écarts sont en fin de section.

### Les cinq règles

1. **Rien sur le système.** Aucun JDK, Node, Gradle, PostgreSQL installé globalement, aucun PATH, aucune variable système, aucun registre, aucun service Windows. Les JDK, Node, scoop ou `~/.gradle` déjà présents sur la machine sont ignorés.
2. **Un seul dossier d’outillage, hors du dépôt** : `NAFURA_TOOLCHAIN`. Défaut : `%LOCALAPPDATA%\nafura` sous Windows (toujours accessible en écriture, sans admin), `~/.nafura` ailleurs. On peut le pointer ailleurs (ex. `C:\nf`) par la variable d’environnement de l’utilisateur. Jamais dans le dépôt : un dossier de travail ouvert par un bac à sable (Codex, Cursor) peut recevoir des droits restreints qui empêchent ses exécutables d’écrire ailleurs.
3. **Une seule source de versions** : `nafura-platform/stack.versions.properties` (JDK, Node, Gradle, PostgreSQL embarqué), avec l’empreinte SHA-256 de chaque archive.
4. **Un seul point d’entrée** : `node <produit>/ops/run.mjs <commande>`, lancé avec le Node de l’outillage. Personne n’appelle `gradlew`, `ng`, `npm`, `java` ou `pg_ctl` à la main.
5. **Docker et droits admin seulement pour `staging` et `prod`** (cluster Kubernetes). `lab`, `check` et `local-staging` n’en ont jamais besoin.

### Le dossier d’outillage

```
%NAFURA_TOOLCHAIN%\
  jdk\<version>\          JDK (archive zip officielle, décompressée)
  node\<version>\         Node portable (archive zip officielle)
  gradle\                 GRADLE_USER_HOME : distribution du wrapper, dépendances, cache de build, daemon
  npm-cache\              cache npm
  data\<produit>\postgres base du lab d’un produit (hors du dépôt)
  logs\<produit>\         lab.log (tout ce que lab affiche) et lab.pids.json (ce que lab a lancé)
  downloads\              archives téléchargées, vérifiées par empreinte
```

Les binaires PostgreSQL du lab viennent d’une dépendance Maven (embedded-postgres), décompressée dans le dossier temporaire : rien à installer.

### Démarrer sur un poste neuf

```bat
nafura-platform\ops\bootstrap.cmd          :: Windows : curl.exe + tar.exe, intégrés à Windows 10+, pas de PowerShell ni de stratégie d’exécution
```
```bash
sh nafura-platform/ops/bootstrap.sh        # Linux, macOS
```

Le bootstrap télécharge le Node portable dans l’outillage, puis lance `ops/product/toolchain.mjs install`, qui installe le JDK et vérifie chaque archive contre l’empreinte SHA-256 publiée par l’éditeur (Adoptium, nodejs.org). Ensuite, toutes les commandes passent par le Node de l’outillage :

```bat
%LOCALAPPDATA%\nafura\node\node-v<version>-win-x64\node.exe <produit>\ops\run.mjs doctor
```

Mettre à jour l’outillage après un changement de `stack.versions.properties` : `run.mjs toolchain` (les anciennes versions sont retirées). **Réseau d’entreprise** : les téléchargements passent par `curl`, qui respecte `HTTPS_PROXY`. À venir : miroirs Maven et npm (`NAFURA_MAVEN_MIRROR`, `NAFURA_NPM_REGISTRY`) et installation hors ligne (`toolchain pack` sur un poste connecté, `bootstrap.cmd --from <archive>`).

### Les commandes

| Commande | Fait | Ne fait jamais |
|---|---|---|
| `toolchain` | installe ou met à jour l’outillage selon `stack.versions.properties`, vérifie les empreintes | toucher au système |
| `doctor` | contrôle l’outillage, les ports, l’espace disque, les processus orphelins, les droits d’écriture (outillage, dépôt, dossier temporaire) et l’étiquette d’intégrité du dépôt ; dit quoi faire | réparer en silence |
| `lab` | API + web + PostgreSQL du lab, journaux dans `logs\<produit>\lab.log`, affiche les temps (`API ready after Ns`) puis `<Nom> is up:` | démarrer si une instance tourne déjà |
| `stop` | arrête **tout** ce que `lab` a lancé : lanceur, API, web, PostgreSQL ; le daemon Gradle reste chaud pour le lancement suivant (il s’arrête seul après 3 h d’inactivité) | tuer un processus qu’il n’a pas lancé ou hors du dépôt |
| `check` | `architecture:check`, build web, host-tests ; code de sortie 0 ou 1 | démarrer un serveur |
| `clean` | vide les caches du produit (build, `.angular`) ; `--data` réinitialise la base du lab | toucher à l’outillage partagé |
| `local-staging`, `staging`, `prod` | inchangés (ci-dessous) | — |

### Règles de build

- **Gradle** : wrapper épinglé, `GRADLE_USER_HOME` dans l’outillage, daemon autorisé (il survit d’un `lab` à l’autre), cache de build actif ; cache de configuration pour `lab` seulement (voir les écarts).
- **Web** : builder `@angular/build` (esbuild + Vite), une seule installation `node_modules` par produit, cache npm dans l’outillage. Les écrans des BCs se chargent à la demande : seul leur manifeste est dans le bundle initial.
- **Processus** : chaque processus lancé par `lab` est enregistré (`logs\<produit>\lab.pids.json`). `stop` et Ctrl+C arrêtent ces processus, puis ce qui écoute encore sur les ports du produit **et** vient du dépôt (le `bootRun` tourne sous le daemon Gradle), puis le PostgreSQL du lab. Un terminal fermé brutalement laisse le PostgreSQL du lab : le `lab` suivant ou `stop` l’arrête.
- **Chemins** : le dépôt peut être n’importe où, espaces compris ; tous les scripts mettent les chemins entre guillemets.

### Règles pour les agents (outillage)

1. Avant tout : `run.mjs doctor`. S’il signale un problème, le corriger ou le remonter ; ne pas contourner.
2. Ne jamais installer quoi que ce soit, ne jamais demander de droits administrateur pour `lab` ou `check`, ne jamais écrire hors du dépôt et de `NAFURA_TOOLCHAIN`.
3. Un agent dont le shell ne peut pas démarrer la JVM ou ouvrir des sockets locaux (bac à sable) lance les commandes dans le terminal de l’utilisateur (ex. panneau Terminal du Code tab), et lit `logs\<produit>\lab.log`.
4. Ne jamais tuer un processus qu’on n’a pas lancé : passer par `run.mjs stop`.

### État au 2026-10-06 et écarts

Livré : outillage hors du dépôt (`bootstrap.cmd`, `bootstrap.sh`, `ops/product/toolchain.mjs`), JDK, Node, caches Gradle et npm et base du lab dans l’outillage, commandes `toolchain`, `doctor`, `stop`, `clean`, journal `lab.log` avec les temps, daemon Gradle et cache de configuration.

| Démarrage de `platform-host` en `lab` (Windows) | API prête | Web prêt |
|---|---|---|
| Avant (JDK dans le dépôt en intégrité basse) | échec | échec |
| Outillage, cache Gradle vide (premier lancement) | 220 s | 220 s |
| Outillage, sans daemon | 45 s | 45 s |
| **Outillage, daemon chaud + cache de configuration** | **18 s** (dont Spring Boot 15 s) | ≈ 15 s (compilation esbuild), en parallèle de l’API |

Requêtes de l’API en `lab` : **≈ 1,5 s → ≈ 35 ms** (2026-10-07) depuis que le PostgreSQL embarqué passe par un pool HikariCP. Sans pool, chaque requête SQL ouvrait une connexion, soit un processus PostgreSQL sous Windows. Toute `DataSource` du lab passe par un pool, comme en cluster.

Bundle initial du web en production : 2,24 Mo → **1,51 Mo** (500 → 343 Ko transférés) depuis le chargement à la demande des BCs (`@angular/build` remplace `@angular-devkit/build-angular`, 430 paquets npm en moins).

| Écart restant | Cible |
|---|---|
| Web : chaque produit compile la plateforme depuis ses sources (démarrage ≈ 15 s, recompilation 5 à 8 s par modification), scrutation toutes les secondes sous Windows, jonction `node_modules` plateforme ↔ produit | plateforme publiée précompilée (ROADMAP n°8) |
| Cache de configuration Gradle refusé par `check` : la tâche de test des host-tests sérialise une `Configuration` (`nafura-migrations.gradle` est compatible depuis le 2026-10-07) | host-tests compatibles, puis cache de configuration partout |
| Miroirs Maven et npm, installation hors ligne | `NAFURA_MAVEN_MIRROR`, `NAFURA_NPM_REGISTRY`, `toolchain pack` / `--from` |
| `deps/` (ancien JDK et Node dans le dépôt) n’est plus lu | à supprimer |

Incident qui a motivé ce contrat : la racine du dépôt a reçu d’un bac à sable une étiquette Windows « intégrité basse ». Le `java.exe` de `deps/` en hérite et ne peut plus écrire ni dans `~/.gradle` ni dans le dossier temporaire : `lab` échoue dès le wrapper Gradle (`…zip.lck (Access is denied)`). Un JDK hors du dépôt n’est pas touché.

### Staging (Docker Desktop, admin)

- Docker Desktop avec Kubernetes ; fichier hosts : `<id>.nafuralabs.staging` et `iam.nafuralabs.staging` → `127.0.0.1` (`powershell -File nafura-platform/ops/add-staging-hosts.ps1`, admin).

## Produits du host : quatre modes, une commande

```bash
node <produit>/ops/run.mjs lab                      # back + front locaux, PostgreSQL embarqué, utilisateurs lab : aucune infra
node <produit>/ops/run.mjs local-staging            # back + front locaux sur la base du staging, sélecteur d’utilisateurs lab
node <produit>/ops/run.mjs staging [--scope=back|front] [--dry-run]
node <produit>/ops/run.mjs prod    [--scope=back|front] [--dry-run] [--yes]
node <produit>/ops/run.mjs check                    # vérifications avant de rendre la main : architecture:check, build web, host-tests
node nafura-platform/scripts/nafura.mjs new <id> --name "<Nom>"     # nouveau produit
```

| Mode | Ce qui tourne | Connexion | Prêt quand |
|---|---|---|---|
| `lab` | API `spec.local.ports.api`, web `spec.local.ports.web` | sélecteur d’utilisateurs lab (`spec.local.users`) ; en `multi`, organisations `spec.local.organizations` et appartenances `users[].organizations` | le journal affiche `<Nom> is up:` |
| `local-staging` | idem, base du staging en port-forward | sélecteur d’utilisateurs lab (`spec.local.users`) | idem ; `staging` lancé au moins une fois |
| `staging` | pods dans `<id>-staging` (Docker Desktop) | Keycloak staging | `rollout status` OK puis réponse HTTP |
| `prod` | pods dans `<id>-prod` (VPS OVH, images poussées au registry) | Keycloak prod | idem ; confirmation demandée |

`staging` et `prod` enchaînent : contrôles (Docker, contexte kubectl, infra prête) → images backend, migrations, web → premier passage : namespace, base et rôle PostgreSQL dédiés, client Keycloak du produit, comptes des propriétaires (`spec.deploy.<env>.owners`, mot de passe temporaire affiché une fois) → Job de migrations → déploiement → rollouts → vérification HTTP.

### Règles pour les agents

1. Lancer `lab` avec le Node de l’outillage et attendre `is up:` dans `%NAFURA_TOOLCHAIN%\logs\<produit>\lab.log` ; une seule instance à la fois (ports du manifeste). Arrêt : Ctrl+C ou `run.mjs stop`. Sur Windows, le front interroge les sources plateforme toutes les secondes : le watcher natif ne voit pas les fichiers hors du produit. E-mail lab : si `ops/secrets/.brevo-lab.env` est présent (clé Brevo staging), les invitations partent vraiment.
2. Session lab pour tester l’API : `POST /api/public/lab/session {"email":"…"}` → `accessToken` ; organisation et rôles : `GET /api/v1/me/session`.
3. `prod` : toujours `--dry-run` d’abord ; jamais `--yes` sans demande explicite. Ne jamais écrire un mot de passe temporaire dans un fichier.
4. Un changement de déploiement commun va dans `nafura-platform/ops/product/` (k8s base + surcharges staging/prod, Dockerfiles, `run.mjs` + `run.test.mjs`). `<produit>/ops/k8s/<env>/` ne porte que des patches propres au produit. Jamais de script ops dans un produit.
5. Contexte kubectl : `docker-desktop` (staging) et `nafura-vps-prod` (prod) par défaut, `KUBE_CONTEXT` sinon ; un contexte prod est refusé pour staging et inversement.
6. Lab mode : pas de données métier en prod (hors vitrines) ; réinitialiser la base du lab : `run.mjs stop` puis `run.mjs clean --data`.

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
node <produit>/ops/run.mjs check                      # architecture:check, build web, host-tests
node <produit>/ops/run.mjs staging --dry-run          # si l’ops a changé
```

Pas de `gradlew`, `npm` ou `ng` à la main : `check` les lance avec l’outillage du projet.

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
