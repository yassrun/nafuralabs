---
id: SEKTOR-198
status: todo
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
```

## Rapport de livraison

À compléter avec commande, règles de blocage, preuves et exceptions.
