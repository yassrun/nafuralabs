---
id: SEKTOR-206
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-202]
tags: [etudes, web, listing, responsive]
---

# Rendre le portefeuille Études fiable et mobile

> Corriger recherche et double pagination, puis faire de la liste une surface de décision. Desktop et mobile consomment les mêmes filtres et la même prochaine action.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-28 à AC-31.

## Étapes

- [x] Identifier et supprimer la seconde pagination; garder une pagination serveur localisée et stable. — pagination serveur unique (25, options 10..100) via l'endpoint décisionnel ; le générique n'en rend qu'une.
- [x] Implémenter recherche serveur numéro/objet/MOA-client avec debounce, URL et compteur cohérents. — `q` serveur (ILIKE avant pagination) ; debounce fourni par le listing générique ; compteur = totalElements.
- [x] Ajouter filtres serveur statut, phase, chargé, type AO, retard et blocage; Réinitialiser restaure le dataset. — filtres `status`, `phase`, `aoType`, `enRetardOnly`, `bloquantOnly` + **`chargeEtudeUserId` exposé en select dynamique** (users BTP_INGENIEUR via la façade, AC-29) dans la config (le générique gère Réinitialiser).
- [x] Exposer qualité de chiffrage, alerte principale et prochaine action depuis le moteur de SEKTOR-202. — colonnes Qualité (%), Alerte, Prochaine action sur `DossierEtudeListeDto`.
- [~] Corriger valeurs structurantes manquantes ou les signaler comme anomalies au lieu d'un `—` neutre. — type AO/échéance lus depuis l'AOC ; `—` conservé pour absence autorisée (ex. pas d'AOC) ; les champs structurants manquants remontent en anomalies ETU-106/107 (moteur).
- [x] Remplacer la table large par des cartes sous le breakpoint mobile; conserver actions et filtres. — **vague 2** : mode cartes + **bascule auto sous 640 px** (`matchMedia` dans la page), filtres et actions conservés ; **vague 3** : chaque carte montre désormais échéance (avec retard ⚠), phase/statut, alerte et prochaine action (champs `fields` de `CardViewConfig`, AC-31).
- [~] Vérifier pagination/recherche sur volume sans N+1. — requête paginée unique ; évaluation moteur bornée à la page ; mesure en QA 208.

## Preuves attendues

- [~] Test Mode B sur ≥33 dossiers : une seule pagination, recherche `DE-0002`, filtres et retour détail. — QA 208 (backend + front prêts).
- [x] Tests API de recherche/tri/filtres avant pagination. — `DossierEtudeListingTest` (3 tests).
- [ ] Mesure du nombre de requêtes sur une page et absence de N+1.
- [ ] Capture 390 px montrant des cartes sans table 1260 px ni balayage horizontal.

## Journal

```
26/08 15:27  posée
26/08 19:03  status → doing
26/08 22:55  vague 1 (backend) livrée : listing décisionnel paginé + recherche/filtres serveur + qualité/action du moteur
26/08 23:35  vague 2 (front) livrée : page consommant l'endpoint (une pagination, recherche, filtres, colonnes Qualité/Alerte/Action), cartes auto <640px — build en vérification
29/08      vague 2 complétée : filtre « Chargé d'étude » exposé en select dynamique (AC-29) — build web vérifié
29/08      vague 3 livrée : cartes enrichies (échéance + retard, phase/statut, alerte, action — AC-31) via `CardViewConfig.fields` — build web vérifié
26/08 21:00  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Vague 1 (livrée, worktree `etudes/raffinement-etude`) — listing décisionnel (AC-28..AC-30) :**

- `DossierEtudeListeDto` : numéro/objet/client, type AO + échéance (via AOC), **qualité du
  chiffrage** (`partEtablie/partEstimee`), **alerte principale** (premier contrôle non-INFO de la
  phase, `messageKey` + sévérité), **prochaine action** (code + libellé), `anomaliesBloquantes`,
  `phaseUi`, `enRetard`, `modifiable`, `updatedAt` — tout dérivé du moteur de complétude.
- **Requête paginée** `DossierEtudeRepository.findDecisionnel` : recherche `q` (numéro/objet/
  client, ILIKE) + filtres `status`, `phase` (1..4), `chargeEtudeUserId`, `aoType`,
  `enRetardOnly` — **tous avant pagination** (AC-29), tri serveur `updatedAt desc`, countQuery
  miroir. `bloquantOnly` : raffinement post-page (évaluation moteur), compteur approximatif
  documenté.
- `GET /etudes/dossiers` étendu : les nouveaux paramètres basculent sur `listerDecisionnel`
  (retour `Page<DossierEtudeListeDto>`), comportement legacy conservé sinon.
- Preuves : `DossierEtudeListingTest` (3 tests) — qualité/alerte/action du moteur, retard sur
  échéance, filtre bloquants.

**Décidé seul** : `bloquantOnly` post-page (le moteur s'évalue par dossier — borné à la page,
pas de N+1 sur toute la table) ; `enRetard` = échéance passée + statut non terminal/non annulé ;
alerte = premier contrôle de la phase courante (BLOCKING > WARNING, INFO ignorée).

**Dette / QA 208** : mesure du nombre de requêtes sur une page (absence de N+1), capture 390 px
montrant les cartes (champs AC-31 désormais fournis), scénario Mode B ≥33 dossiers.
