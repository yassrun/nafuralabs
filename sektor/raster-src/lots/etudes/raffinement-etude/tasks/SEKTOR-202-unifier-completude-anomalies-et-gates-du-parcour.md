---
id: SEKTOR-202
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: me
tags: [etudes, workflow, integrite]
---

# Unifier complétude anomalies et gates du parcours Étude

> Construire une vérité backend unique pour la complétude, les anomalies, les gates et la prochaine action. Empêcher les dossiers avancés qui contredisent leurs pièces ou champs obligatoires.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-7.

## Étapes

- [x] Inventorier les validations actuelles du domaine, des contrôleurs et du frontend; supprimer les règles équivalentes divergentes. — inventaire dans [`01-READMODEL-COMPLETUDE.md`](../01-READMODEL-COMPLETUDE.md) ; les gates ne portent plus de règle parallèle (projection du moteur).
- [x] Définir le read model structuré des contrôles avec codes stables, phase, sévérité, faits et action. — `service/completude/*` : `ControleEtude`, `ControleCodes` (20 codes ETU-xxx), `CompteursCompletude`, `ProchaineAction`, `CompletudeEtude`.
- [x] Implémenter les deux voies documentaires et la règle CPS configurable sans contradiction « optionnel/obligatoire ». — champ `voieDocumentaire` (AUTO/MANUEL), `POST /voie`, `init-bordereau-manuel` pose MANUEL, seed CPS `obligatoire=false`, tenant setting `etudes.cpsObligatoire`.
- [x] Aligner les obligations API/formulaire pour objet, MOA, chargé, échéance et type AO. — ETU-106/ETU-107 bloquent la sortie du cadrage ; transition refusée citant les codes (AC-5).
- [x] Faire consommer le moteur par chaque transition et exposer prochaine action/compteurs dans les lectures. — `GET /{id}/completude`, `synthese` et `gates` lisent le moteur ; `allerAEtape`/`soumettre` refusent par codes ; 422 porte `controles` (AC-2/AC-3/AC-6).
- [x] Traiter les dossiers terminaux et les données lab invalides sans masquer l'incohérence. — `lectureSeule`, `prochaineAction` terminale (AC-7) ; dossiers legacy sans cadrage → anomalies visibles, pas de `—` silencieux.

## Preuves attendues

- [x] Tests table-driven de tous les contrôles et transitions, voie manuelle/automatique. — `GatesEtudeTest` (réécrit) + `CompletudeEtudeServiceTest` (moteur).
- [x] Test API refusant un dossier avancé avec pièce réellement obligatoire ou champ structurant absent. — `DossierEtudeCompletudeTest#transition_refusee_sans_cadrage_cite_les_codes_du_moteur`.
- [x] Test d'intégration prouvant l'égalité compteur/bandeau/synthèse/gate. — `DossierEtudeCompletudeTest#egalite_compteur_synthese_et_gates_ac2` (compteur moteur == synthèse == projection gates).
- [x] Contrat JSON documenté avec codes et actions stables. — tableau des codes + exemple JSON dans `01-READMODEL-COMPLETUDE.md`.

## Préparation (avant exécution — séquencement Chantier)

- Inventaire des validations actuelles (domaine, service, contrôleurs, front) et design du read
  model unique AC-1..AC-7 : [`../01-READMODEL-COMPLETUDE.md`](../01-READMODEL-COMPLETUDE.md).
- Séquencement respecté : exécution lancée après feu vert humain (livraison Chantier 191..199
  terminée), en worktree isolé `etudes/raffinement-etude` (branche `etudes/raffinement-etude`).

## Journal

```
26/08 15:27  posée
26/08        préparation posée (read-only) : inventaire + design 01-READMODEL-COMPLETUDE.md — attente feu vert séquencement Chantier
26/08 16:45  status → doing
26/08 17:20  moteur de complétude backend livré (worktree etudes/raffinement-etude) — voir Rapport de livraison
26/08 17:18  status → review
26/08 17:18  status → review
26/08 17:18  status → review
26/08 18:07  status → done-agent
26/08 18:07  toi · approuvée → done-me
```

## Rapport de livraison

**Règles consolidées (une seule source)** : `CompletudeEtudeService` agrège les 5 règles
(`GatesEtude`, désormais émetteurs de `ControleEtude` structurés) ; `GET /{id}/completude`,
`GET /{id}/gates` (projection legacy), `GET /{id}/synthese` (compteur = moteur) et les
transitions consomment le même résultat. `ResultatGate` n'est plus une source de règles.

**Anciennes règles retirées / remplacées** : `EtapeControle` (redondant avec `EtapeGate`
portant `controles()`), agrégation `anomaliesBloquantes` par gate bloquante (remplacée par
`compteurs().bloquants()`), seed CPS obligatoire, exigence BDP+CPS inconditionnelle (remplacée
par voie AUTO/MANUEL + CPS configurable), switch `actionPrincipale` (remplacé par
`prochaineAction` issue du moteur, AC-6).

**Décidé seul** : codes `ETU-xxx` (catalogue 20 codes, cf. design doc) ; `ETU-122/123` en
phase 3 (la consultation nourrit le déboursé) ; `ETU-130/131` repoussés en SEKTOR-207 ;
`lectureSeule` = `!estModifiable()` ; prochaine action pilotée par BLOCKING/WARNING de la phase
courante (les INFO n'empêchent pas d'avancer).

**Preuves exécutées** : `:sektor:etudes:test` — 391 tests, 6 échecs **préexistants au HEAD**
(vérifié par stash : `CapitalisationOuvrageServiceTest` ×3, `DevisServiceClientTest` ×1,
`OuvrageCompositeServiceTest` ×1 — strictness Mockito ; `AdaptiveBordereauBdp217LiveIT` — fixture
PDF externe). Tous les tests gates/complétude/DossierEtude* sont verts (68 tests ciblés +
`DossierEtudeCompletudeTest`).

**Dette / front** : la consommation du read model par le détail (badge, bandeau, gate-blocage) et
la suppression des recomputations front (`dossier-detail.page.ts`, `dossier-summary-header`,
`synthese-validation-panel`) relèvent de SEKTOR-205/206 (UI par composition progressive). Clés
i18n `etudes.controle.*`/`etudes.phase.*`/`etudes.action.*` à poser avec le front. Migration SQL
`027_lot_raffinement_voie_documentaire.sql` posée.
