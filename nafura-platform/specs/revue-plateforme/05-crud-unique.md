# 05 — Une seule couche CRUD serveur

> Revue 2026-10-07, doublon D4. Taille **M** (back). Aucune dépendance. Débloque le lot 2 de [01](01-liste-unique.md).

## Objectif

Toute ressource CRUD de la plateforme est un `RecordController`. `CrudService` / `JpaCrudService` et les `*ControllerBase` de `sysconfig` disparaissent du chemin de la plateforme.

## Besoin

- Deux couches serveur font la même chose :
  - `RecordController` : pagination, filtre, `/properties`, cycle de vie, audit, accès des pièces jointes et notes ;
  - `CrudService` + `JpaCrudService` + `*ServiceBase` / `*ControllerBase` : l'ancienne génération.
- L'audit est branché deux fois : `CrudAuditHook` pour `RecordController`, et `JpaCrudServiceAuditPostProcessor` + `AuditableHibernateInterceptor` pour l'ancienne couche.
- Les ressources de `sysconfig` (calendriers, listes de codes, séquences, valeurs de référence, tags) n'ont ni la grammaire de filtre ni `/properties`, donc pas l'archétype de liste.
- La capability à venir **Référentiels** (ROADMAP, « Nouvelles capabilities ») recouvre les listes de codes et les valeurs de référence : elle doit partir d'une base unique.

## Existant

- `core/framework/src/main/java/ma/nafura/framework/service/crud/` : `CrudService`, `JpaCrudService`, `Specs`, exceptions, `CrudAuditHook` (ce dernier est aussi utilisé par `RecordController` ; il reste).
- `core/framework/…/framework/crud/Exposed.java`.
- `features/configuration/sysconfig/…/api/controller/base/` : `CalendarControllerBase`, `CodeListControllerBase`, `NumberingSequenceControllerBase`, `ReferenceValueControllerBase`, `TagControllerBase` et leurs `*ServiceBase`.
- `audit/` : `JpaCrudServiceAuditPostProcessor`, `AuditableHibernateInterceptor`, `CrudAuditHookImpl`.
- Les entités de `sysconfig` : vérifier qu'elles étendent `TenantEntity` (`RecordController<E extends TenantEntity>` l'exige).

## Contrat

### Lot 1 — Inventaire

Une table dans cette spec (à compléter par la personne affectée) : ressource, entité, base actuelle, permissions, endpoints hors CRUD, écrans web qui l'appellent, et usage par Sektor (`grep` sur `sektor/sources/backend`).

### Lot 2 — Migration ressource par ressource

Pour chaque ressource :
- l'entité étend `TenantEntity` (colonnes `created_by` / `updated_by` ajoutées au schéma cible, sans migration défensive : lab mode) ;
- un `RecordController<E>` avec `records/<ressource>.json` ;
- les permissions passent de `…read/write` à `…read/create/update/delete` ; les rôles de la plateforme sont mis à jour ;
- la logique propre (prochain numéro d'une séquence, par exemple) va dans un service métier appelé par un endpoint dédié (`POST /{id}/next`), ou par les points d'accroche de [06](06-points-accroche-record.md) une fois livrés ;
- suppression de `*ControllerBase`, de `*ServiceBase` et des implémentations.

Ordre conseillé : séquences de numérotation (débloque 01), tags, listes de codes, valeurs de référence, calendriers.

### Lot 3 — Retrait de l'ancienne couche

- Si Sektor n'utilise pas `CrudService` : supprimer `CrudService`, `JpaCrudService`, `Specs`, `Exposed`, `JpaCrudServiceAuditPostProcessor`, et `AuditableHibernateInterceptor` s'il ne sert qu'à l'ancienne couche.
- Sinon, les marquer `@deprecated` comme dans [04](04-heritage-sektor.md), avec un test d'architecture qui interdit leur usage dans `nafura-platform/sources/backend`.

## Règles

- `RecordController` ne gagne pas d'option pour imiter l'ancienne couche. Un manque se décrit dans [06](06-points-accroche-record.md).
- Pas de DTO de liste ni de service CRUD écrit à la main (PLATFORM.md).

## Vérification

1. `node platform-host/ops/run.mjs check` ; host-tests et `testWithout-sysconfig` verts.
2. Lab : Administration → séquences, tags, listes de codes : lecture, création, modification ; journal d'audit alimenté.
3. Sektor compile (backend) si le lot 3 touche des classes qu'il importe.

## Critères d'acceptation

- [ ] Aucune ressource de `nafura-platform/sources/backend` ne s'appuie sur `CrudService` ou `*ControllerBase`.
- [ ] Chaque ressource migrée répond à `GET …/properties`.
- [ ] L'audit des ressources migrées passe par `CrudAuditHook` uniquement.

## Documentation

- `docs/PLATFORM.md` § Données et API : rien à ajouter (c'est déjà la règle) ; retirer toute mention de `CrudService` s'il y en a.
- `docs/capabilities/audit.md` : un seul branchement d'audit CRUD.
