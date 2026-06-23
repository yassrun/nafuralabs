---
specVersion: 1
kind: app
appId: venue-catalog
name: Venue Catalog
status: draft
language: fr
tenancy: platform
targetPlatforms: [web]
businessCode:
  backendRoot: products/venue-catalog/backend
  webRoot: products/venue-catalog/web
abstractions:
  required:
    - :platform:core:authorization
    - :platform:core:identity
    - :platform:features:collaboration:doc-manager
    - "@platform/core/components"
    - "@platform/core/i18n"
  missing:
    - :platform:integrations:google-places
    - :platform:core:job-runner
---

# Venue Catalog

## 1. Vision

Service interne Nafura de collecte, normalisation, revue et projection de lieux a partir de Google Places et d'autres sources futures, afin d'alimenter Layali, Beauty et d'autres apps sans coupler leur domaine metier au provider source.

## 2. Personas

### 2.1 Platform Admin
- Profil : equipe Nafura qui supervise les catalogues de lieux, les imports et la qualite des donnees.
- Contexte d'usage : desktop, back-office interne, operations de lancement pays/ville/app.
- Attentes : lancer des imports, voir les doublons, approuver les lieux fiables, publier vers une app cible.

### 2.2 Catalog Operator
- Profil : operations/data steward charge de nettoyer les fiches et de resoudre les conflits.
- Contexte d'usage : workflow quotidien de revue apres import automatique.
- Attentes : identifier rapidement les champs incomplets, comparer la source brute au modele canonique, archiver les faux positifs.

### 2.3 App Editor
- Profil : product owner ou ops d'une app consommatrice (Layali, Beauty, autre).
- Contexte d'usage : parametrage de taxonomie et mapping metier avant publication vers l'app cible.
- Attentes : transformer un lieu canonique en projection `venue`, `salon` ou autre, sans perdre la tracabilite source.

### 2.4 Service Consumer
- Profil : compte technique backend d'une app consommatrice.
- Contexte d'usage : synchronisation pull ou webhook interne.
- Attentes : recuperer une projection stable, versionnee, idempotente, sans connaitre les details Google Places.

## 3. Roles applicatifs

| Role | Description | Perimetre | Permissions principales |
|---|---|---|---|
| PLATFORM_ADMIN | admin complet du catalogue | plateforme | `catalog.*`, `catalog.job.*`, `catalog.mapping.*`, `catalog.publish.*` |
| CATALOG_OPERATOR | revue et enrichissement des lieux | plateforme | `catalog.read`, `catalog.update`, `catalog.approve`, `catalog.archive`, `catalog.job.read` |
| APP_EDITOR | mapping vers une app cible | plateforme | `catalog.read`, `catalog.mapping.*`, `catalog.publish.read` |
| SERVICE_CONSUMER | client machine-to-machine | plateforme | `catalog.consumer.read` |
| SYSTEM | batch interne et scheduler | plateforme | `catalog.job.run`, `catalog.refresh.run`, `catalog.publish.run` |

Les permissions completes sont declarees dans le manifest runtime Nafura. Cette section sert d'intention pour les agents.

## 4. Tenancy et identite

- Mode tenancy : plateforme.
- Definition d'un tenant : aucun tenant metier expose. Les donnees du catalogue sont globales et partitionnees par `appId` ou `countryCode`, pas par tenant client.
- Auth : Keycloak realm `nafura` ; clients `venue-catalog-web`, `venue-catalog-backend`, `venue-catalog-consumer`.
- Auth machine-to-machine : token service avec scope `catalog.consumer.read` pour les endpoints de projection consommee par Layali, Beauty et autres apps.

## 5. Zones et navigation globale

Zones :
- `catalog` : recherche, revue et validation des lieux canoniques.
- `jobs` : imports, refresh et diagnostics d'execution.
- `mappings` : projections par app cible (`layali`, `beauty`, autres).
- `publish` : export/pull des projections versionnees.

Routes principales : voir [navigation.md](navigation.md).

## 6. Conventions globales

- Locales supportees : `fr` (default), `en`.
- Devise : pas de devise globale ; les projections d'app peuvent derivent leurs propres conventions.
- Fuseau horaire : `Africa/Casablanca` par defaut pour les operations Maroc ; stocker les datetimes en ISO offset-aware.
- Format des dates : `dd/MM/yyyy HH:mm` en `fr`, `MM/dd/yyyy hh:mm a` en `en`.
- Mock API : voir [mock-api.md](mock-api.md).
- Provider-first mais non provider-coupled : tout identifiant externe est stocke dans `sourceRecords[]`, jamais promu comme cle publique de l'app consommatrice.
- Canonical-first : les apps consommatrices lisent une `projection` versionnee, pas le payload Google brut.
- Deduplication : cle logique basee sur `(normalizedName, lat, lng, city, primaryType)` avec revue humaine si la confiance est insuffisante.

## 7. Domaines metier (modules backend)

| Domaine | Responsabilite | Module Gradle |
|---|---|---|
| source-adapter | appel providers externes, pagination, quotas, retries | `:domains:venue-catalog:source-adapter` |
| catalog-place | modele canonique du lieu, qualite et statut | `:domains:venue-catalog:catalog-place` |
| catalog-job | orchestration async des imports et refresh | `:domains:venue-catalog:catalog-job` |
| catalog-mapping | projection vers les schemas d'apps consommatrices | `:domains:venue-catalog:catalog-mapping` |
| publish-gateway | API de pull par app, versioning et cursors de synchro | `:domains:venue-catalog:publish-gateway` |
| compliance | attribution provider, retention, champs autorises | `:domains:venue-catalog:compliance` |

## 8. Abstractions et libs Nafura a utiliser

### Existantes (a utiliser tel quel)
- `:platform:core:authorization` : guards par permission et scopes machine-to-machine.
- `:platform:core:identity` : tokens users/admins et service accounts.
- `:platform:integrations:storage` : cache media autorise, documents d'audit d'import si necessaire.
- `@platform/core/components` : tableaux, formulaires, drawer de detail, badges de statut.
- `@platform/core/i18n` : libelles back-office et erreurs de validation.

### Manquantes (a creer avant ou pendant le developpement)
- `:platform:integrations:google-places` : client type-safe Google Places (text search, nearby, details, photos metadata, quotas, retry/backoff).
- `:platform:core:job-runner` : abstraction de jobs asynchrones avec statut, progression, retries, verrou idempotent.

## 9. Integrations externes

- Google Places : source primaire V1 pour bootstrap des lieux (`Text Search`, `Nearby Search`, `Place Details`).
- Maps : Google Maps seulement comme source de referentiel ; les apps consommatrices gardent la liberte d'affichage ou de lien final.
- Storage : cache photos Google dans MinIO bucket `venue-catalog-media` via `:platform:integrations:storage` ; TTL 30 jours, attribution obligatoire, URLs signees. Voir [media-pipeline.md](media-pipeline.md).
- Autres sources futures : saisie manuelle, CSV partenaires, import depuis CRM Nafura, autres providers maps.

## 10. Donnees sensibles et conformite

- PII : faible. Les fiches lieux stockent essentiellement donnees publiques d'etablissement ; ne pas ingerer de reviews utilisateurs, emails personnels ou contenu libre inutile.
- Conformite provider : conserver l'attribution source, la date de fraicheur, et les restrictions de republication. Les agents ne doivent pas supposer qu'une photo Google peut etre persistee indefiniment.
- Retention : conserver l'historique de jobs 12 mois ; conserver les `sourceRecords` tant qu'une projection publiee en depend ; purger les payloads bruts inutiles selon la politique provider.
- Audit : toute approbation, archivage, fusion de doublons et publication vers une app est journalisee.

## 11. Non-fonctionnel

- Disponibilite cible : 99.5% pour l'API de projection consommee par les apps.
- Latence cible : p95 < 300 ms pour `GET /catalog/places*`, p95 < 250 ms pour `GET /catalog/apps/:appId/projections*`.
- Scale attendu : 50 000 lieux canoniques Maroc, 10 apps consommatrices, 500 imports/jour, 5 000 projections publiees/jour.
- Reseau : les imports provider sont asynchrones, relancables, et tolerants aux quotas/transitoires.
- Idempotence : deux imports identiques sur la meme fenetre ne doivent pas creer de doublons canoniques ou de publications multiples.

## 12. Decoupage agent

Voir `work-packages/` pour la liste detaillee. Vue d'ensemble :

| Vague | Perimetre | Dependances |
|---|---|---|
| 1 | wp-01 fondation Google Places, jobs async, catalogue canonique, recherche admin | aucune |
| 2 | wp-02 revue, dedupe, mappings multi-apps, publication versionnee | wp-01 |

## 13. Specifications techniques

| Document | Contenu |
|---|---|
| [backend-spring-boot.md](backend-spring-boot.md) | Stack, modules Gradle, schema PG, Redis, API wp-01 |
| [media-pipeline.md](media-pipeline.md) | Cache photos Google dans MinIO, TTL, attribution, compliance |
| [architecture.svg](architecture.svg) | Vue architecture cible |
| [collection-campaigns.md](collection-campaigns.md) | Campagnes import Maroc |

## 14. Open questions

- ~~Politique exacte de cache et republication des photos Google~~ : tranche V1 dans [media-pipeline.md](media-pipeline.md) — cache MinIO TTL 30j, `reusable=false`, URL signees.
- Le service doit-il pousser par webhook les projections publiees ou rester en pull-only V1 ? Decision provisoire : pull-only V1.
- Faut-il un concept de fusion explicite entre deux `catalogPlaceId` ou une simple archive de doublon vers un principal suffit-elle en V1 ?
