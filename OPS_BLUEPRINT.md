# Blueprint — Ops

**Statut :** figé (dossier · envs) · **reste à détailler**  
**Ops** = comment on **fait tourner** un projet logiciel (deploy, env, secrets, runbooks).
Raster : [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md) · Pact : [`ARCHI_BLUEPRINT.md`](ARCHI_BLUEPRINT.md).

---

## Règle figée

**Toute app ou tout site déployé a un dossier `ops/`.**
Pas de projet `ops/` peer. Comptage Raster-only (compta, perso) : **pas** d’`ops/`.

```text
<projet>/
├── raster-src/     # obligatoire (tout projet)
├── ops/            # obligatoire si déployé
├── e2e/
└── sources/        # runtimes — [`NAFURALABS.md`](NAFURALABS.md) § Intérieur
```

---

## Deux contenus, même nom de dossier

| Projet | `ops/` contient |
|--------|-----------------|
| **nafura-platform** | Infra **lab** : cluster, Postgres partagé, Keycloak, Vault, CLI (`nlops`), runbooks transverses |
| **Toute autre app / site** | Deploy **de ce projet seulement** : overlay K8s, images, ingress, runbooks de l’app |

Sektor ne duplique pas Keycloak. La platform ne porte pas l’ingress `sektor.*`.

Legacy : `nafura-platform/ops/k8s` + `nafura-platform/ops` → `nafura-platform/ops/` ; `products/<app>/deploy/` → `<app>/ops/`.

Tickets ops = Raster **du même projet** (PLT pour l’infra lab, SEKTOR pour un overlay Sektor). Ops n’a pas son propre préfixe ID.

---

## Environnements — 2 clusters, 3 phases

**Environnement = cluster**, pas une branche Git. Il n’y a que **deux** env :

| Env | Cluster | Images |
|-----|---------|--------|
| **staging** | lab (Docker Desktop aujourd’hui) | locales `:staging` |
| **prod** | VPS (OVH aujourd’hui) | registry `:prod` |

Pas d’env `dev` déployé. Pas de branche `staging` / `prod`.

### Trois phases (même code, pas le même runtime)

| Phase | Front / back | Infra (DB, IAM, objet) | Images Docker |
|-------|----------------|------------------------|---------------|
| **1. hybrid** (`devstaging`) | **locaux** — build + live reload | **staging** | **non** |
| **2. staging** | pods staging | staging | **oui** (`:staging`) |
| **3. prod** | pods prod | prod | **oui** (`:prod`) |

**Hybrid** = itération rapide. Le process tourne sur la machine ; il **pointe** sur l’infra staging déjà up. On ne rebuild **pas** les images, on ne passe pas par les pods staging.

```text
[front local] ──┐
[back local]  ──┼──► Postgres / Keycloak / MinIO / Vault   STAGING
                └──► pas d’image, pas de pod app
```

**Staging pods** = go / no-go comme en prod (ingress, migrate, images).  
**Prod** = après OK staging, même commit.

Ordre : hybrid → staging (images) → prod.  
Ne pas faire phase 2/3 à chaque fix UI.

### Hybrid — identité QA (aujourd’hui)

Lab / hybrid seulement. **Jamais** sur pods staging/prod K8s (`NAFURA_DEV_CURSOR_AUTH_ENABLED` interdit hors local).

Aujourd’hui (Sektor) : one-shot **`make -C nafura-platform/ops mode-b`** · tenant **`qa-local`** · auto-login **`qa@nafuralabs.local`** · users par rôle opt-in (`qa-token.sh magasinier`) · contrat `.cursor/rules/cursor-qa-browser.mdc`.

Graphe métier (chantier converti, BL, approbations) : **pas** dans le preset — les preuves le fabriquent via l’API. Ne pas activer `NAFURA_DEMO_RUNTIME_SEED`.

---

## Cycle de vie (noms actuels)

| Phase | Commande | Rebuild image ? |
|-------|----------|-----------------|
| hybrid | `dev-up` | non |
| staging | `stg-up` | oui |
| prod | `prod-up` | oui |

Scope : `front` | `back` | `full`.  
Migrate **avant** le backend si le schéma change.

---

## Infra — partagée, pas recopiée par produit

**Qui possède :** tout ce qui sert **plusieurs** projets = `nafura-platform/ops/`.
Ce qui meurt avec **une** app = `<app>/ops/`.

Ça ne change **pas** si le cluster grandit (VPS → managed K8s OVH). On change **où** ça tourne (`KUBE_CONTEXT`), pas **qui** possède.

| Maintenant (VPS) | Demain (cluster plus gros) |
|------------------|----------------------------|
| 1 namespace infra, 1 Postgres, 1 Keycloak, 1 Vault, 1 MinIO | Même **modèle** ; plus de CPU/RAM, éventuellement opérateur PG / IAM HA |
| Apps = namespaces séparés, overlays dans `<app>/ops/` | Idem — on scale les **workloads app** indépendamment |

**Interdit :** un Postgres + Keycloak **dans** chaque projet « au cas où le scaling ». Drift + RAM.  
**Autorisé plus tard :** extraire **un** datastore d’une app (ex. Postgres dédié Sektor) = change **TECHNICAL** platform/ops + `sektor/ops` — pas un nouveau BC.

Docs, notifs, IAM : **infra + modules platform**, pas recopiés dans l’app.

---

## Postgres — 1 instance, 1 **base** par projet

Pas 1 pod Postgres par projet (VPS).  
Pas non plus N apps dans **le même** `public` schema.

| Couche | Choix figé (maintenant) |
|--------|-------------------------|
| Processus | **1** Postgres (pod / service) dans `nafura-platform/ops` |
| Isolation **inter-apps** | **1 database** par projet (`nafura_erp`, `nafura_venue_catalog`, …) |
| Isolation **tenants** (dans Sektor) | affaire du **BC / socle** de l’app (`tenant_id` ou schema-par-tenant) — **pas** un pod PG par client |

`provision-db` = `CREATE DATABASE`, pas un nouveau StatefulSet.

**Pas comme docs/notifs :** l’app **se connecte en JDBC** à *sa* database. La platform ne proxy pas le SQL. L’instance PG est partagée ; le **contenu** de `nafura_erp` reste à Sektor.

**Scaling Postgres plus tard** :

1. Plus de disque / RAM sur **la même** instance  
2. Opérateur (CloudNativePG, etc.) **un** cluster, toujours N databases  
3. **Si** une app satue : un cluster PG **dédié** pour **cette** app, toujours déclaré dans platform/ops + connexion dans `<app>/ops`

On ne décide pas (3) tant que le VPS tient (1).

**À surveiller (prod) :** une instance **suffit** tant que le lab / VPS n’a pas de charge réelle. Lever (3) si :

- une app **étouffe** les autres (CPU, IO, connexions) ;
- backup / restore / HA doivent diverger par app ;
- volume concurrentiel réel (plus du lab).

Jusque-là : ne pas splitter « au cas où ».

---

## Migrations — Job lifecycle **avant** le backend

**Règle :** aucun pod backend avec du SQL en attente. `stg-up` / `prod-up` `SCOPE=back|full` = migrate **puis** rollout. Pas de `deploy` seul après un changelog.

### Mécanisme (Liquibase)

```text
SQL dans les modules (app + platform consommée)
        │
        ▼
collectMigrations (Gradle) → changelog maître
        │
        ▼
image lifecycle → Job K8s  <app>-lifecycle
        │                    namespace de l’app
        ▼                    JDBC → database de l’app (ex. nafura_erp)
backend rollout
```

- **1 Job par projet**, dans **son** namespace, contre **sa** database.
- L’outil (collect + image) = `nafura-platform/ops` (aujourd’hui `tools/lifecycle`).
- Les fichiers SQL = avec le **code qui possède les tables** (`<app>` ; platform si tables platform dans cette base).
- Lab : changelogs **clean** (create/alter/drop assumés) — pas de dual-write « pour la prod métier ».

Hybrid (`dev-up`) : migrate **aussi** si le schéma a changé (Job staging ou équivalent) avant `bootRun`. Ne pas laisser le back local sur un schéma en retard.

### Variantes actuelles (à converger)

| App | Comment |
|-----|---------|
| Sektor | Liquibase **Job K8s** (cible) |
| venue-catalog | Flyway au **startup** backend |

Cible : **Job dédié**, pas migrate-in-process au boot (échec visible, pas de CrashLoop mélange app + SQL).

**À surveiller :** aujourd’hui une partie du SQL **platform** est collectée **dans** le changelog Sektor (`nafura_erp`). Quand platform aura sa propre database (si besoin), ses migrations suivent **cette** base — pas un second Job dans Sektor.

---

## À détailler

### Secrets

<!-- Vault, pas de secrets commités, … -->

### Manifests / images

<!-- kustomize, Dockerfiles, registry · … -->

### Runbooks

<!-- bootstrap, incident, reset · … -->

### Interdit

<!-- kubectl ad hoc, ops d’une app dans platform, infra partagée dans Sektor · … -->
