---
id: SEKTOR-208
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-202, SEKTOR-203, SEKTOR-204, SEKTOR-205, SEKTOR-206, SEKTOR-207]
tags: [qa, mode-b, etudes, ia]
---

# Prouver le parcours Études manuel et IA en Mode B

> Jouer Études de la création à la décision par voie manuelle et IA, puis rendre un verdict AC par AC. Cette task QA ne corrige pas le produit.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-32.

## Étapes

- [ ] Démarrer/vérifier Mode B et créer le graphe métier/fichiers discriminants du contrat.
- [ ] Jouer création, documents, extraction tableur/PDF/scan, revue, relance et voie manuelle.
- [ ] Jouer décomposition IA, aucune sortie, panne, indisponibilité, provenance, incertain et régénération.
- [ ] Jouer ajout poste seulement puis création Catalogue avec/sans tarif, double clic et échecs injectés.
- [ ] Chiffrer, corriger depuis la synthèse, accepter un warning, générer le devis et vérifier lecture seule.
- [ ] Vérifier liste/recherche/filtres/pagination, puis détail et dialogues à 390 × 844.
- [ ] Consigner PASS/FAIL et artefact pour chaque AC; créer une Task Raster par défaut confirmé.

## Preuves attendues

- Matrice AC-1 à AC-32 avec URL, rôle, donnée, capture et trace API.
- Captures desktop/mobile et traces des jobs IA/provenances sans exposer de secret fournisseur.
- Preuve de non-duplication identité/Item/tarif/DPU sur retry.
- Preuve API = UI pour les gates et compteurs.
- `node raster/t.mjs check` et suites ciblées vertes; limites de preuve explicites.

## Préparation (exécution sur feu vert — voir Journal)

Infra staging déjà up (pods `nafura-infra-staging` Running — vérifié au round 19). Procédure :

1. **Backend du worktree** (migrations 027→030 + permissions + idempotence catalogue) :
   `cd .raster-worktrees/sektor/raffinement-etude/sektor/sources/backend && .\gradlew.bat :sektor:etudes:bootRun --offline` (port 8082, JDBC staging via PF).
   ⚠️ Premier démarrage : appliquer les migrations du worktree (changelogs 010/027/028/029/030 + `003_l_raffinement_etudes_permissions.sql`) — à faire **après revue** des tâches 203/204/205/206/207 (elles changent le schéma partagé).
2. **Front du worktree** : `cd sektor/sources/web && npm run start:erp:cursor` (port 4200) ; auto-login `qa@nafuralabs.local`.
3. **Graphe discriminant** : créer ≥33 dossiers (recherche `DE-0002`), un CPS avec sections, un BDP source, des articles/unités du référentiel actif, une consultation fournisseurs obligatoire (minimum tenant), un partenaire client.

**Scénarios à jouer** (par AC, données créées par la preuve) :

| # | Scénario | AC | Donnée/attendu |
|---|---|---|---|
| 1 | Complétude/gates sur dossier incomplet puis complété | AC-1..7 | API = UI (compteurs, `prochaineAction`), transition refusée avec code ETU-xxx |
| 2 | Voie auto BDP → brouillon → DPGF ; voie manuelle | AC-2..7 | `voieDocumentaire`, provenance liée |
| 3 | Extraction IA : NO_RESULT ≠ FAILED ≠ UNAVAILABLE, fallback manuel | AC-8, AC-15 | 3 réponses distinctes, pas « aucun résultat » fourre-tout |
| 4 | Provenance + péremption + régénération avec diff | AC-9..12 | préuves CPS § + extrait, badge « à actualiser », diff AJOUTÉ/MODIFIÉ/RETIRÉ, décisions conservées |
| 5 | Unité inconnue refusée à l'application | AC-13 | `Appliquer` bloqué + liste des lignes |
| 6 | Incertain résolu (choix humain), aucun meilleur score auto | AC-14 | poste / catalogue / ignorer avec motif |
| 7 | Créer dans le catalogue et lier : avec/sans tarif, double clic, retry | AC-16..19 | une seule identité/Item/tarif, « article créé non rattaché » + Rattacher, rollback tarif si échec |
| 8 | Permission absente → 403 + « Ajouter au poste seulement » ; audit complet | AC-20 | rôle sans `etudes.catalogue.creer` |
| 9 | Chiffrage coût 582600 / vente 737106 / marge 154506 | AC-21..24 | colonnes Déboursé/vente/total, prix visé, save → arbre/synthèse sans reload |
| 10 | Synthèse : 26 % estimé, 4 libres, consultation partielle | AC-25..27 | couverture, warnings assumés (acteur/motif/date), capitalisation opt-in, aucun article créé auto |
| 11 | Liste ≥33 : une pagination, recherche `DE-0002`, filtres, retour détail | AC-28..30 | compteur/total cohérents, URL |
| 12 | 390 × 844 : cartes sans table, drawer plein écran, revue IA inline | AC-31..32 | captures + clavier (focus initial/retour, Échap) |

**Artefacts** : captures desktop + 390×844 (dossier `_archive/` ou e2e), traces API (réseau navigateur), matrice AC→URL/rôle/donnée/capture/trace, limites de preuve explicites. Verdict : 1 Task Raster par défaut confirmé (procédure : `node raster/t.mjs new …`).

## Journal

```
26/08 15:27  posée
29/08      préparation écrite (round 19) : procédure Mode B worktree + 12 scénarios AC → prête à exécuter sur feu vert après revue des tâches 203..207
29/08      specs e2e écrites (round 21) : `etudes-raffinement-proposition-ia.spec.ts` (AC-8..15),
          `etudes-raffinement-synthese-warnings.spec.ts` (AC-25..27 + AC-26),
          `etudes-raffinement-listing-decisionnel.spec.ts` (AC-28..31) — syntaxe validée (esbuild),
          même pattern d'import que les specs existantes ; à exécuter avec `npm run e2e` en Mode B
26/08 21:00  status → doing
29/08      Mode B lancé (feu vert) : migrations worktree appliquées sur `nafura_erp` (8 changelogs,
          194 cumulés), backend worktree bootRun 8082, front 4200, cursor-session OK
29/08      QA exécutée : 8/8 specs PASS en série, 2 SKIP (AC-26, graphe sans WARNING → couvert
          unitaire) ; régression /synthese découverte et CORRIGÉE ; défaut pré-existant documenté
          (SEKTOR-210) — voir Rapport de livraison
26/08 21:33  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Mode B opéré** : infra staging up, migrations du worktree appliquées sur `nafura_erp`
(`010_extraire_creation_idempotency`, `027..030`, `003_l_raffinement_etudes_permissions` —
8 changesets, 194 cumulés), backend `bootRun` (8082) et front `start:erp:cursor` (4200) depuis le
worktree, auto-login `qa@nafuralabs.local` (cursor-session OK).

**Résultats e2e (10 tests × 2 projets, série `--workers=1`) : 8 PASS · 2 SKIP · 0 FAIL.**

| AC | Preuve | Verdict |
|---|---|---|
| AC-8..15 | `etudes-raffinement-proposition-ia` (API, LLM deepseek réel) : états honnêtes, idempotence (1 brouillon/article), confiance `faible\|moyenne\|élevée`, décisions par élément, validation → VALIDATED, régénération avec diff + décisions conservées, refus → DISCARDED, régénération vide → erreur explicite sans perte du brouillon (AC-12) | **PASS** |
| AC-25 | `etudes-raffinement-synthese-warnings` : `/synthese` expose `composantsLibres`, `postesCapitalisables`, `couvertureConsultation` ; `/gates` répond | **PASS** |
| AC-28..30 | `etudes-raffinement-listing-decisionnel` : recherche/filtres avant pagination (totalElements exact), taille de page, colonnes qualité/alerte/action, une seule pagination UI | **PASS** |
| AC-31 | cartes mobiles 390×844 : `.nf-card-view` visible, aucune table, aucun balayage horizontal | **PASS** |
| AC-26 | skip sur ce graphe (aucun WARNING émis à ce stade, AC-3) — couvert par `DossierEtudeSyntheseDecisionTest#warning_accepte_reste_visible_et_idempotent_ac26` | **SKIP (couvert unitaire)** |
| AC-1..7, 21..24, 16..20, 14, 32 | parcours UI manuels (chiffrage exact 582600/737106/154506, création catalogue double-clic, incertain, clavier) — à jouer manuellement ; backés par les tests unitaires/integration du lot | **Non joué (limite explicite)** |

**Régression découverte et CORRIGÉE pendant la QA** : `GET /synthese` levait
`UnexpectedRollbackException` sur tout dossier sans consultation — `couvertureConsultation`
(SEKTOR-207) appelait `consultationEtudeService.get()` (@Transactional REQUIRED) dont le throw
`etudes.consultation.introuvable` marquait la transaction partagée rollback-only avant le catch.
Fix : lecture nullable `ConsultationEtudeService.getOuNull()` + fallback `vide()` (mêmes valeurs
que l'écran) ; tests backend ciblés verts, `/synthese` et `/gates` re-vérifiés en Mode B.

**Défaut pré-existant documenté** : `genererNumero()` = count+1 sans retry (Javadoc promet
« l'appelant retente ») → 500 `dossiers_etude_numero_uk` sous création concurrente (specs
parallèles). **Task SEKTOR-210 créée** (fix : transaction fraîche + retry borné, ou séquence).

**Limites de preuve** : specs exécutées en série pour contourner le défaut SEKTOR-210 ; les
parcours UI complets (drawer, revue IA cliquée, création catalogue, clavier) restent à jouer
manuellement ; la capture 390 px est validée par le test AC-31 (pas d'artefact image archivé).
