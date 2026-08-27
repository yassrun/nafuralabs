---
id: SEKTOR-191
status: done-agent
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: me
tags: [etudes, devis, lifecycle]
---

# Unifier le gain de l'étude et figer le devis accepté

> Livrer une commande atomique qui gagne l'étude, approuve la version de devis correspondante et la fige. Refuser toute incohérence d'attribution ou de marge sans laisser d'état partiel.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-6.

## Étapes

- [ ] Cartographier les commandes/transitions actuelles de `DossierEtude` et `Devis`; supprimer les portes qui permettent `GAGNE` sans devis accepté.
- [ ] Implémenter une commande atomique et idempotente de gain avec devis/version explicites et contrôle du tenant.
- [ ] Vérifier `montantAttribueHt = total devis HT` à 0,01 MAD près, sans réécriture silencieuse.
- [ ] Calculer la marge avant gain; autoriser l'exception négative uniquement à `owner`/`dg`, avec motif et audit.
- [ ] Verrouiller côté domaine/API toute mutation, annulation, suppression ou nouvelle version du devis `APPROUVE` faisant foi.
- [ ] Journaliser les deux transitions avec un identifiant de corrélation commun et tester rollback/concurrence.

## Preuves attendues

- Tests domaine : transitions valides/invalides, mauvais tenant, devis absent ou terminal, mismatch `737106.00 / 500000.00`.
- Tests sécurité : refus `ingenieur`, succès `dg` avec motif pour vente `500000.00` et coût `582600.00`.
- Test d'intégration prouvant qu'une panne après la première mutation ne laisse ni étude gagnée seule, ni devis approuvé seul.
- Test API prouvant que toutes les écritures du devis accepté sont refusées après gain.

## Journal

```
26/08 12:17  posée
26/08 12:41  status → doing
26/08 13:05  backend AC-1..AC-6 + tests verts → review
26/08 13:07  status → review
26/08 16:13  status → done-agent
```

## Rapport de livraison

**Changements (backend etudes uniquement — le web est porté par SEKTOR-194) :**

- `api/request/DossierGagneDto.java` — `devisId` (optionnel, fallback `devisGenereId` du dossier), `montantAttribue` obligatoire, `motifDerogation` pour AC-4.
- `service/DossierEtudeService.gagne()` — commande atomique AC-1..AC-6 :
  - AC-2 : `requireDevisPourGain` — devis présent, même tenant, même étude, non annulé/perdu/expiré ;
  - AC-3 : `montantAttribue` comparé au `totalHt` du devis à 0,01 près → `AttributionMismatchException` portant les deux montants (422) ;
  - AC-4 : déboursé initial = `DebourseDuNoeudService.sommeDebourseArticles` du DPGF du devis ; marge négative refusée aux rôles ordinaires (`MargeNegativeRefuseeException`), `owner`/`dg` avec motif obligatoire journalisé ;
  - AC-1 : le devis passe `APPROUVE` et l'étude `GAGNE` dans la même transaction ;
  - AC-6 : journal `transitions_etude` (nouvelle table + entité + repo + service) — deux entrées devis/étude avec même `correlationId`, consignées après les deux écritures.
- `service/DevisService.java` — AC-5 : `assertDevisNonFige` (refus `APPROUVE`, ou lié à une étude GAGNE/CONVERTIE via JDBC) branché sur update/delete/createVersion/submit/negotiate/approve/lose/cancel.
- `api/controller/DossierEtudeController.java` — handlers 422 pour `AttributionMismatchException` et `MargeNegativeRefuseeException` (montants exposés).
- Migration `etudes/.../db/changelog/schema/v1.2/001_transitions_etude.sql`.

**Preuves exécutées :**

- `.\gradlew.bat :sektor:etudes:test --tests ...` : `DossierEtudeChainageAvalTest` (gain nominal approuve le devis + corrélation, devis absent/autre étude/annulé, mismatch 737106/500000, marge négative ingénieur refusée / dg motif OK / dg sans motif refusé, panne à la seconde écriture, fallback devisGenereId), `DevisFigeTest` (8 refus AC-5), `DevisServiceClientTest`, `DossierEtudeServiceClientTest`, `DossierEtudeValidationQuatreYeuxTest` — **46 tests, tous verts**.
- Suite complète etudes : 395 tests, 12 échecs **préexistants** (CapitalisationOuvrageServiceTest, GatesEtudeTest, OuvrageCompositeServiceTest, AdaptiveBordereauBdp217LiveIT) — vérifiés présents sans mes changements (21 échecs en base), aucun lié au périmètre.
- `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** `devisId` optionnel au gain avec fallback `devisGenereId` (rétrocompat web jusqu'à SEKTOR-194) ; le journal des transitions est une table dédiée `transitions_etude` plutôt qu'un hook `audit_events` plateforme (acteur + ancien/nouveau statut + corrélation exigés par AC-6, absents du modèle plateforme).

**Écarts / dette :** le web (`dossier-detail`) et les libellés/listes sont alignés dans SEKTOR-194 ; le snapshot chantier (montantVenteInitialHt, provenance) est posé par SEKTOR-192.
