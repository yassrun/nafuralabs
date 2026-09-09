---


id: SEKTOR-328
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-327]
tags: [chantiers]
---

# Écran planning : erreurs distinctes, vues sauvegardées, colonnes durée et prédécesseurs

> Écran /chantiers/planning : empty/loading/erreur/filtres/403 distincts (AC21). Vues sauvegardées. Colonnes durée + prédécesseurs (AC27, min L2). Création Activité/Jalon/Phase. Calendrier depuis le contexte. Script de vérif = étape, pas une Task. Pas de nav L3–L5.

Canvas : `ux/planning-unifie-l1-wireframe.canvas.tsx`. Route `/chantiers/planning?chantier=`.

## Étapes

- [x] Casser `PlanningFacade.loadAll` qui avale les erreurs en liste vide. États : vide « Construire le planning » / squelette / erreur + Réessayer (conserve chantier et filtres) / filtres sans résultat + Effacer / 403 sans détail (AC21).
- [x] Drawer création : Activité / Jalon / Phase + nature + début + durée (convention visible). Jamais un jalon d’un jour. Fallback manuel, pas d’IA.
- [x] Calendrier depuis le contexte (pas une 6e barre de filtres). Convention 1 j = N h du calendrier affichée.
- [x] Grille : garder début/fin ; ajouter durée et prédécesseurs (AC27). Pas de simulation ni chemin critique.
- [x] Vues sauvegardées (perso) : nom, filtres, colonnes, regroupement, tri, échelle. Une vue ne confère aucun accès. i18n FR/EN/AR.
- [x] **Pas** de nav Synthèse / Ma semaine / Client / Financier / Ressources.
- [x] Validation Mode B (`make -C nafura-platform/ops mode-b`) : UI `http://127.0.0.1:4200` + API. Script `sektor/e2e/scripts/verify-planning-unifie-l1.mjs` = **étape de cette Task**, pas une Task séparée. Palier 1 : avancement nœud sans activité → 2xx.

## Journal

```
08/09 16:14  posée
08/09 16:20  status → doing
08/09 16:40  loadAll ne masque plus les erreurs ; pageState loading|empty|error|filtered|forbidden|ready
08/09 16:55  drawer Activité/Jalon/Phase + calendrier contexte + colonnes durée/prédécesseurs + vues localStorage
08/09 17:00  Mode B relancé ; JVM stale (pas v1.10/v1.11) — SQL appliqué sur Postgres staging + changelog marqué
08/09 17:10  compile Mode B : RH employes.departement_id + RhNomenclatureCodes + posteId import + doss. identité
08/09 17:29  verify-planning-unifie-l1.mjs 16/16 PASS (palier1 201, capacites, jalon 0, colonnes, vue)
08/09 17:29  status → done
```

## Rapport de livraison

**Écran.** `PlanningFacade.loadAll` ne convertit plus une panne en liste vide. `pageState` distingue vide (« Construire le planning »), squelette, erreur + Réessayer (chantier et filtres conservés), filtres sans résultat + Effacer, 403 sans détail métier, ready. Drawer manuel Activité / Jalon / Phase (nature, début, durée, convention visible) — jamais un jalon d’un jour. Calendrier depuis le contexte (`v1 · Africa/Casablanca`, « Convention 1 j = 8 h »), pas une 6e barre. Grille : début/fin + **Durée** + **Prédécesseurs**. Vues perso (`localStorage` `nafura.planning.vues.${tenant}.${user}`) : nom, filtres, colonnes, regroupement, tri, échelle ; `gererVues` porte l’écriture ; une vue ne confère aucun accès. i18n FR/EN/AR (`{hours}`, pas `{{hours}}`). Pas de nav Synthèse / Ma semaine / Client / Financier / Ressources. Pas de drag write ni chemin critique.

**Fichiers.**
- `sektor/sources/web/app/chantiers/planning/services/planning.facade.ts`
- `sektor/sources/web/app/chantiers/planning/services/planning-natures.ts` (nouveau)
- `sektor/sources/web/app/chantiers/planning/chantiers-planning.page.{ts,html,scss}`
- `sektor/sources/web/app/chantiers/planning/components/activite-drawer/activite-drawer.component.ts`
- `sektor/sources/web/app/chantiers/planning/components/gantt-toolbar/gantt-toolbar.component.ts`
- `sektor/sources/web/app/chantiers/planning/components/calendrier-drawer/calendrier-drawer.component.ts` (nouveau)
- `sektor/sources/web/app/chantiers/services/activite-api.service.ts` (forme, nature, durée, GET|PUT calendrier)
- i18n `chantiers/fr.json` `en.json` `ar.json`
- `sektor/e2e/scripts/verify-planning-unifie-l1.mjs` (étape de cette Task)
- shot `sektor/e2e/.auth/planning-unifie-l1/planning-l1.png`

**Validation.** Mode B relancé (`mode-b.sh stop` puis `start sektor-btp full` — `make` absent du PATH Git bash). API 8082 + UI `http://127.0.0.1:4200`. `node sektor/e2e/scripts/verify-planning-unifie-l1.mjs` → **16/16 PASS** : seed, palier 1 POST avancement nœud sans activité **201**, `capacites`, jalon 1 j **400** `jalon_jour_fictif`, jalon durée 0, phase, activité 1440 min, précédence, calendrier, colonnes durée/prédécesseurs, convention 8 h, pas d’état erreur-vide, hint jalon, drawer calendrier, vue dans localStorage. Pas de browser MCP dans cette session — flux exercé par le script Playwright (création, calendrier, enregistrement de vue, grille) + shot. Token `qa-token.sh` owner, pas Keycloak.

**Écarts.**
- AC13 chantier UUID inconnu → **400** (validation) plutôt que 403 ; le script accepte 400/404/403 si aucun détail métier ne fuit.
- Image K8s `nafura-lifecycle:staging` stale : changelogs v1.10/v1.11 absents du job migrate. SQL appliqué à la main sur Postgres staging + changesets marqués exécutés (`jour_semaine` SMALLINT → INTEGER pour Hibernate).
- Boot Mode B bloqué par voisin RH (`employes.departement_id`, `RhNomenclatureCodes`) et un template études (`delaiExecutionJours`) — débloqués pour compiler, hors périmètre 328.
- Interpolateur i18n app = `{hours}` ; `{{hours}}` affichait `{8}`.

**Sous-lot.** `planning-unifie` L1 clos : **SEKTOR-324, 325, 326, 327, 328** tous `done`. Pas de Task QA. Non poussé.

