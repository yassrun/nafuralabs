# Host v1 — une app sans BC qui démarre depuis sa config

> `platform-host/` = `app.nafura.json` + ~10 lignes de démarrage par runtime. Login lab, shell, réglages user / organisation, administration : tout vient de la plateforme.

Lot : [`../LOT.md`](../LOT.md) · Contrat amont : [`../contrat-v1/CONTRAT.md`](../contrat-v1/CONTRAT.md).

## Intention

Le sandbox montre qu’une app plateforme tourne, mais il porte encore du générique : lab backend (session, tenant, users), 251 clés i18n des features plateforme, câblage Angular (~150 lignes). Copier le sandbox reproduirait Sektor. Ce sous-lot remonte ce générique et prouve qu’un produit sans BC n’a plus que sa config.

## Critères d’acceptation

- **AC-1** Le produit `platform-host/` ne contient que : `app.nafura.json`, un point d’entrée par runtime, la config d’outillage (Gradle, Angular, TypeScript) et l’environnement. Aucun composant, service, contrôleur ou seeder.
- **AC-2** Web : `provideNafuraHost(app, businessContexts)` valide les manifestes, enregistre `ApplicationConfig`, projette le shell, monte les routes des capabilities requises par `spec.requires`, la navigation plateforme, l’auth lab et l’i18n plateforme.
- **AC-3** Une capability requise non montable par le host échoue au démarrage avec un message nommant la capability.
- **AC-4** Backend : module plateforme `core:lab` (`nafura.lab.*`) — roster, session HS256, tenant et users seedés. Désactivé par défaut ; refuse de démarrer sous le profil `prod`.
- **AC-5** i18n : les clés des features plateforme vivent dans la plateforme ; le sandbox les consomme au lieu de les copier.
- **AC-6** Le sandbox build toujours ; `architecture:check` vert.

## Périmètre

Inclus : `platform/host/` (web), `core/lab` (backend), `platform-host/` (produit), déplacement i18n.

Exclus :

- BCs et rail de contexte (c’est `bc-v1`) ; le host v1 a `businessContexts: []` et un rail désactivé.
- Keycloak (seul `auth.mode: lab` est monté en v1).
- `cap.notifications` : le module backend `notification` tire approbation, commentaire et audit ; retirée du host v1 tant qu’elle n’est pas découplée.
- Migration du backend sandbox sur `core:lab` (dette explicite : le sandbox garde sa copie lab jusqu’à `bc-v1`).
- `@env` : contrat compile-time de `core/`, fourni par le produit tant que `core/` le lit.

## Approche

Remonter avant de créer : chaque ligne générique trouvée dans le sandbox part dans la plateforme, puis le produit est écrit contre elle. Les parties pures (lecture du manifeste, navigation, capabilities montables) sont testées sous `architecture:check` ; le câblage Angular est prouvé par build + démarrage.

Ports : backend 8090, web 4400 (8082, 8085, 4200, 4210, 4300 pris).

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | `core:lab` backend + auto-configuration | exec | — |
| 2 | `platform/host` web + i18n plateforme + tests purs | exec | — |
| 3 | Produit `platform-host/` (web + backend) | exec | 1, 2 |
| 4 | Preuves : build, démarrage, session lab, sandbox inchangé | exec | 3 |

## Validation technique

| Preuve | Couvre |
|--------|--------|
| Arbre `platform-host/` : config + points d’entrée seulement | AC-1 |
| `npm run architecture:check` (tests host purs inclus) | AC-2, AC-3, AC-6 |
| `bootRun` host : `/actuator/health` UP, `GET /api/public/lab/users`, `POST /api/public/lab/session` → JWT | AC-4 |
| `ng build` host et sandbox | AC-2, AC-5, AC-6 |

## Blocages extérieurs

Aucun.
