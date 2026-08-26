---
id: SEKTOR-197
status: todo
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-196]
tags: [web, chantiers, cockpit]
---

# Refondre la fiche chantier en cockpit de pilotage

> Remplacer la vue d'ensemble par le cockpit du wireframe, sans dupliquer les formulaires des modules. Une seule identité, des KPI fiables et une action primaire réellement actionnable.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-4 et AC-9 à AC-17. UX : [`../ux/cockpit-wireframe.md`](../ux/cockpit-wireframe.md).

## Étapes

- [ ] Faire de `Pilotage` la route par défaut et supprimer H1/code/entête en double sans réintroduire l'ancien placeholder.
- [ ] Construire l'en-tête, la rangée KPI, la zone prochaine action/alertes, le flux du mois et les résumés spécialisés.
- [ ] Consommer strictement l'ordre et les états du read model; ne recalculer ni marge, ni retard, ni permission côté UI.
- [ ] Relier chaque résumé/action à la route propriétaire avec chantier, période et origine de retour conservés.
- [ ] Implémenter variantes `EN_PREPARATION`, `EN_COURS`, `SUSPENDU` et états terminaux.
- [ ] Traiter chargement, identité en erreur, section partielle indisponible, vide légitime et état concurrent changé.
- [ ] Respecter design system, focus clavier et sévérité non portée par la couleur seule.

## Preuves attendues

- Tests composants sur toutes les variantes et états de disponibilité.
- Capture desktop comparée au wireframe pour préparation, en cours, suspendu et clôturé.
- Parcours action primaire → module → retour cockpit avec contexte préservé.
- Vérification qu'aucun calcul financier/temporel et aucune liste de permission ne sont dupliqués dans le frontend.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec routes/composants remplacés, captures, accessibilité et dette UX.
