---
id: SEKTOR-183
status: review
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [chantiers, ux, frontend]
---

# UI chantiers — EN_PREPARATION et dates contractuelles sans fallback fictif

> Le front Chantiers doit afficher le statut réel `EN_PREPARATION`.
> Il ne doit jamais inventer un ordre de service ou une fin prévue à partir de `dateDebut`.

## Étapes

- [x] Vérifier le mapper et les écrans qui transforment `EN_PREPARATION` en `PROSPECT`.
- [x] Supprimer les fallbacks UI qui remplacent une fin prévue ou un ordre de service absents par `dateDebut`.
- [x] Propager le nouveau libellé de statut et le libellé `Non défini` sur les surfaces touchées.
- [x] Valider le slice via diagnostics ciblés et build Angular.

## Journal

```
25/08 13:18  posée
25/08 13:18  status → doing
25/08 13:26  mapper, badges, formulaires et traductions corrigés ; build rejoué
25/08 13:24  status → review
25/08 13:40  status → done-agent · gate none → done-me
25/08 14:31  status → review
```

## Rapport de livraison
- `chantier.mapper.ts` expose désormais `EN_PREPARATION` comme statut UI de premier rang, garde la symétrie vers le backend et ne fabrique plus `dateFinPrevue` ni `dateOrdreService`.
- La liste, la fiche, la création et l'édition Chantiers reconnaissent le nouveau statut avec libellés et badges dédiés.
- La fiche affiche `Non défini` quand l'ordre de service, le début ou la fin prévue sont absents, au lieu d'inventer une date.
- Traductions FR/EN/AR ajoutées pour `EN_PREPARATION` et `Non défini`.
- Preuves exécutées : `get_errors` sur les fichiers touchés, puis `npm run build:dev` dans `sektor/sources/web`.
- Résultat build : plus aucune erreur sur ce slice ; seul reste l'erreur préexistante `app/socle/approbations/components/submit-approval-button/submit-approval-button.component.ts:131` (`TS2366`).
