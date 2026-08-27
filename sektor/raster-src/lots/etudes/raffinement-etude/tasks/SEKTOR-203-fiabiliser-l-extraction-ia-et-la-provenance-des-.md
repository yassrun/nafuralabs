---
id: SEKTOR-203
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-202]
tags: [etudes, ia, extraction, provenance]
---

# Fiabiliser l'extraction IA et la provenance des suggestions

> Donner aux extractions IA des états honnêtes, une provenance exploitable et une revue récupérable. Aucune suggestion ne devient vérité sans décision humaine.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-8 à AC-15.

## Étapes

- [x] Uniformiser états et erreurs des extractions bordereau, marché/CPS, descriptif et décomposition. — vague 1 (bordereau/CPS) + vague 2 (proposition décomposition) : contrat 7 états partout.
- [x] Persister job, brouillon, idempotency key, empreintes d'entrées, schéma et métadonnées techniques nécessaires à la reprise. — `PropositionIa` (entrées empreintées, clé d'idempotence unique, `schemaVersion`) ; job existant déjà idempotent.
- [x] Rattacher à chaque champ/ligne/composant les extraits ou la connaissance métier qui le justifient. — preuves CPS (référence + extrait) / origine LIBELLE sur la proposition.
- [x] Calculer l'indicateur de confiance serveur sans utiliser la confiance brute du LLM comme autorisation. — indicateur `faible|moyenne|élevée` (schéma, source, cohérence unité/type, qualité rapprochement) ; `confianceBruteLlm` au diagnostic seulement (AC-11).
- [x] Livrer acceptation/refus/correction par élément et comparaison lors d'une régénération. — décisions par élément + validation/refus explicite + `regenerer` avec **diff enregistré** (AJOUTE/MODIFIÉ/RETIRÉ) sans écraser les décisions (AC-12).
- [x] Rendre le seau incertain résoluble par choix, recherche, poste seulement ou création Catalogue. — rattaché à SEKTOR-204 (création Catalogue) ; résolu dans la **revue IA inline** (choix poste / catalogue / ignorer avec motif — AC-14), création Catalogue gouvernée par la permission (AC-20).
- [x] Garantir fallback manuel pour `NO_RESULT`, `FAILED` et `UNAVAILABLE`, avec messages distincts. — **vague UI livrée** : le panel consomme la proposition persistée et rend chaque état distinctement (`aucun résultat` ≠ `indisponible` ≠ `échec` ≠ déjà validée/refusée), avec chemin manuel (AC-8).
- [x] Intégrer provenance, confiance et diff dans la revue IA du poste. — **vague UI livrée** : preuves CPS (référence + extrait) ou « connaissance métier IA » (AC-10), indicateur de confiance serveur (AC-11), badge « à actualiser » (AC-9), résumé du diff de régénération (AC-12), décisions par élément + validation explicite (AC-12) — voir Rapport de livraison.

## Preuves attendues

- [x] Tests adaptateurs et services couvrant les sept états, reprise après reload et concurrence. — `DocumentExtractionJobEtatTest` (12) + `PropositionIaServiceTest` (10 : états, idempotence, reprise, péremption, confiance, décisions, régénération diff).
- [x] Tests de provenance : page/section CPS exacte et proposition périmée après modification du descriptif. — provenance CPS (référence + extrait) ; `entree_modifiee_marque_a_actualiser_ac9`.
- [x] Test prouvant qu'une sortie LLM avec prix/id/unité inconnue ne traverse pas la frontière référentielle. — prix/id résolus par Catalogue ; `unite_inconnue_abaisse_la_confiance_serveur` (cohérence unité/type dans le diagnostic, indicateur jamais « élevée ») ; **verrou à l'application** : au point d'application humain, une unité hors référentiel actif (hors unité de l'article) bloque `Appliquer` avec la liste des lignes à corriger (AC-13, appliqué côté front où le référentiel est chargé).
- [~] Tests UI des décisions élémentaires et de la régénération avec diff. — **vague UI livrée** (décisions + diff implémentés et consommés dans le panel) ; tests UI automatisés bloqués par l'erreur préexistante du runner Karma → couverts en QA 208 (parcours `etude-ia-provenance-et-regeneration`).

## Préparation (avant exécution — séquencement Chantier)

- Inventaire de la chaîne IA (jobs, propositions, rattrapage, front) et design du contrat unique
  états/provenance/confiance/reprise AC-8..AC-15 :
  [`../02-ETATS-IA-PROVENANCE.md`](../02-ETATS-IA-PROVENANCE.md).
- Séquencement : exécution lancée après approbation humaine de SEKTOR-202 (done-me), worktree
  isolé `etudes/raffinement-etude`. Vagues 1 à 3 livrées (backend complet) ; le seau incertain
  passe par SEKTOR-204 et le front par la vague UI.

## Journal

```
26/08 15:27  posée
26/08        préparation posée (read-only) : inventaire + design 02-ETATS-IA-PROVENANCE.md — attente feu vert (continuité Chantier + SEKTOR-202)
26/08 18:07  status → doing
26/08 18:40  vague 1 livrée : contrat 7 états (AC-8) + NO_RESULT/UNAVAILABLE + VALIDATED/DISCARDED
26/08 19:05  vague 2 livrée : proposition IA persistée (AC-15), confiance serveur (AC-11), preuves CPS (AC-10), péremption (AC-9), décisions par élément (AC-12)
26/08 19:35  vague 3 livrée : régénération avec diff enregistré (AC-12), cohérence unité/type (AC-13) — status → review
26/08 18:25  status → review
29/08      vague UI livrée : le panel poste consomme les endpoints proposition-ia (proposer/regenerer/decider/valider), états AC-8 rendus distincts, preuves/confiance/diff affichés, badge « à actualiser », décisions + validation explicite — build web vérifié
26/08 21:00  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Vague 1 (livrée) — états IA (AC-8, AC-15)** : cf. entrée précédente du rapport (7 états,
NO_RESULT/UNAVAILABLE, VALIDATED/DISCARDED, `DocumentExtractionJobEtatTest`).

**Vague 2 (livrée) — proposition persistée (AC-9..AC-12, AC-15) :**

- `PropositionIa` (entité + `028_lot_raffinement_proposition_ia.sql`) : geste, état AC-8,
  `idempotencyKey` unique (tenant), entrées empreintées (`descriptifHash` + sections CPS),
  sortie (`schemaVersion` + contenu), preuves, confiance, décisions, régénérations,
  `aActualiser`.
- `PropositionIaService` : `proposer` idempotent par clé dérivée des entrées (dossier+article+CPS)
  → UNAVAILABLE / NO_RESULT / REVIEW distincts ; `decider`/`valider`/`refuser` (AC-12) ;
  `actualiser` marque la péremption (AC-9) ; confiance serveur (AC-11) avec `confianceBruteLlm`
  au diagnostic ; preuves CPS (référence + extrait) ou LIBELLE (AC-10).
- Endpoints : `POST/GET /articles/{articleId}/proposition-ia`, `GET /proposition-ia`,
  `decider|valider|refuser`, `actualiser`.
- Preuves : `PropositionIaServiceTest` (7 tests).

**Décidé seul** : clé d'idempotence dérivée des entrées (pas d'UUID client obligatoire — le retry
sur les mêmes entrées est naturellement idempotent) ; indicateur de confiance « élevée » si
schéma valide + source + ≥60 % de rapprochement ; la péremption compare le hash descriptif.

**Vague 3 (livrée) — régénération et référentiel (AC-12, AC-13) :**

- `regenerer` (endpoint `/proposition-ia/regenerer`) : le nouveau brouillon remplace l'ancien,
  le **diff** (AJOUTÉ/MODIFIÉ/RETIRÉ par seau et désignation normalisée) est enregistré dans
  `regenerations` avec date et acteur ; les décisions humaines restent visibles ; `aActualiser`
  repasse à faux (régénération fraîche). Indisponible/sans résultat → erreur explicite, le
  brouillon existant n'est pas perdu.
- **Frontière référentielle (AC-13)** : la cohérence unité/type (unité dans le référentiel actif
  ou égale à celle de l'article) alimente le diagnostic de confiance — une unité inconnue du
  modèle abaisse l'indicateur et n'est jamais acceptée silencieusement.
- Preuves : 3 tests ajoutés (`regeneration_enregistre_les_differences_et_garde_les_decisions`,
  `regeneration_indisponible_ne_perd_pas_le_brouillon`, `unite_inconnue_abaisse_la_confiance_serveur`).

**Vague UI (livrée, front — AC-8 à AC-12) :**

- Le panel poste « Proposer avec l'IA » consomme désormais la **proposition IA persistée**
  (`POST/GET /articles/{articleId}/proposition-ia`, `regenerer`, `decider`, `valider`) au lieu de
  la suggestion non persistée — idempotence serveur par clé (AC-15), plus de cache local.
- **États AC-8 rendus distincts** dans la revue inline : `UNAVAILABLE` (« service indisponible +
  manuel »), `NO_RESULT` (« aucun composant détecté + manuel »), `FAILED` (« échec — relancez +
  manuel »), `VALIDATED`/`DISCARDED` (« déjà décidée → actualiser »), `REVIEW` → revue à trancher.
- **Provenance (AC-10)** : preuves CPS citées (référence § + extrait) ou « connaissance métier IA »
  (jamais « issue du CPS » sans source) ; **confiance serveur (AC-11)** affichée
  (`faible|moyenne|élevée`, jamais la confiance brute) ; **badge « À actualiser si descriptif »**
  quand l'entrée a changé (AC-9).
- **Décisions + validation (AC-12)** : « Appliquer » enregistre une décision `ACCEPTE` par ligne
  retenue puis valide la proposition (échec non bloquant, l'écriture DPU reste faite) ;
  **régénération** avec résumé du diff (ajoutés/modifiés/retirés) affiché, brouillon conservé si
  régénération indisponible.
- Types TS + méthodes API (`PropositionIa`, `proposerIa`, `deciderIa`, `validerIa`, `refuserIa`,
  `actualiserIa`, `regenererIa`, `listerPropositionsIa`) dans `dossier-etude-api.service.ts`.
  Vérifié par build AOT `npm run build:dev`.

**Décidé seul (vague UI)** : les décisions envoyées au serveur portent `element` (désignation
normalisée) + `decision: ACCEPTE` — le backend les conserve telles quelles (AC-12) ; l'échec de
`decider`/`valider` après écriture DPU est signalé en toast (proposition restée en revue,
relançable) ; le diff est affiché en résumé, le détail complet reste dans `regenerations`.

**Dette restante** : tests UI automatisés (runner Karma bloqué par erreur préexistante) → QA 208 ;
i18n `etudes.proposition_ia.*` non appliquée (Études en chaînes françaises directes, cohérent avec
le reste du BC) ; le verrou d'unité est appliqué côté front au point d'application — un verrou
serveur sur l'écriture DPU (via `suggereParIa`) reste possible si le flux est validé en Mode B.
