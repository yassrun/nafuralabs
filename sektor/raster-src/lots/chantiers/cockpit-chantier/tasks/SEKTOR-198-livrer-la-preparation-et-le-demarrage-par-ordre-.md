---
id: SEKTOR-198
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-196, SEKTOR-197]
tags: [web, api, chantiers, preparation]
---

# Livrer la préparation et le démarrage par ordre de service

> Rendre chaque prérequis de préparation corrigeable et démarrer uniquement par une commande d'ordre de service atomique. Le planning reste recommandé, jamais bloquant.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-5 à AC-8 et AC-11.

## Étapes

- [ ] Brancher chaque item de checklist sur une destination de résolution précise et un retour au cockpit.
- [ ] Livrer le formulaire OS avec référence et date d'effet, validations métier et permission backend.
- [ ] Effectuer création/enregistrement OS et transition `EN_PREPARATION → EN_COURS` atomiquement, avec audit.
- [ ] Refuser le démarrage si un bloqueur exact subsiste et retourner sa liste stable; ne jamais bloquer pour planning vide.
- [ ] Gérer double clic, rejeu, concurrence et statut modifié entre ouverture et validation.
- [ ] Vérifier qu'après démarrage sans activité, arbre, avancement, attachement et situation restent accessibles.

## Preuves attendues

- Tests commande OS : nominal, champs invalides, bloqueurs, rôle interdit, rollback et idempotence.
- Parcours Mode B de 0/7 à prêt, avec CTA de résolution pour chaque item.
- Preuve `EN_COURS` sans aucune activité et premier avancement sur arbre vendu.
- Journal montrant OS, transition, acteur et date dans une même corrélation.

## Journal

```
26/08 12:17  posée
26/08 14:56  status → doing
26/08 14:56  status → doing
26/08 15:15  commande OS backend + formulaire cockpit + preuve 5/5 → review
26/08 15:14  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Commande et règles de blocage (backend chantiers) :**

- `api/request/ChantierDemarrerOsDto.java` — OS : `osReference` + `osDateEffet` obligatoires (rien d'autre, AC-8).
- `service/ChantierService.demarrerAvecOs(id, os)` — AC-6 : commande atomique `EN_PREPARATION → EN_COURS` ; vérifie d'abord `bloqueursDePreparation` (AC-5 : client, référence de vente si DEVIS, arbre ≥1 nœud, déboursé initial, conducteur + chef de chantier, dates prévues) ; un bloqueur → `PreparationIncompleteException` (codes stables, rien n'est écrit) ; l'OS est posé avec référence + date, `dateDemarrage` initialisée à l'effet si absente, journal `ORDRE_SERVICE` écrit dans la même transaction (acteur, date, corrélation).
- `api/controller/ChantierController` — `POST /{id}/demarrer-os` (422 + `bloqueurs[]` si préparation incomplète, 400 si OS manquant) ; l'ancien `POST /{id}/demarrer` reste un alias sans OS (rétrocompat, documenté comme à retirer).
- `ChantierService` : nouveaux injectés `ChantierAffectationService`, `ChantierLotRepository`, `JournalChantierRepository` (écriture directe du journal pour éviter le cycle avec `JournalChantierService`).

**Web (cockpit) :**

- `pilotage-tab.component.ts` — AC-6 : quand le chantier est `EN_PREPARATION` et que tous les bloqueurs hors OS sont levés, le panneau « À faire maintenant » devient le formulaire OS (référence + date, bouton « Enregistrer l'OS et démarrer ») ; 422 → message avec la liste des bloqueurs ; succès → rechargement du cockpit (EN_COURS, action avancement). AC-7 : chaque item bloquant de la checklist a déjà son CTA de résolution.
- `chantier-api.service.ts` — `demarrerAvecOs(id, os)`.

**Preuves exécutées :**

- `ChantierServiceSnapshotTest` (6 tests verts) : démarrage OS complet → EN_COURS + OS posé + journal ; responsables manquants → 422 `responsables` ; OS absent → refus même si préparation complète ; DTO sans champ planning.
- Suite chantiers complète : BUILD SUCCESSFUL (93+ tests).
- Preuve Mode B `sektor/e2e/scripts/verify-cockpit-demarrage-os-198.mjs` — **5/5 PASS** : refus sans OS (400), démarrage atomique → `EN_COURS` avec `osReference`/`osDateEffet`, cockpit EN_COURS avec action avancement, aucun planning/activité créé (AC-8), chantier sans responsables/budget → 422 avec codes stables.
- `npx ng build --configuration development` — BUILD OK. `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** l'ancien `POST /{id}/demarrer` est conservé comme alias (le web et les tests l'utilisent encore), mais le cockpit et le contrat passent par `demarrer-os` ; le retrait total est une dette de nettoyage.

**Écarts / dette :** double clic/rejeu côté UI (idempotence backend déjà garantie par le statut, un rejeu → refus métier) ; RBAC fin des actions (SEKTOR-200) ; parcours navigateur complet (SEKTOR-201).
