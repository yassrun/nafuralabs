---
id: SEKTOR-200
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-197, SEKTOR-198]
tags: [web, chantiers, rbac, responsive]
---

# Adapter le cockpit aux rôles et au mobile

> Fermer les variantes RBAC, responsive et accessibilité sur le cockpit livré. À 390 px, aucun fait ni geste autorisé ne disparaît ou devient ambigu.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-4, AC-11 et AC-20 à AC-22. UX : [`../ux/cockpit-wireframe.md`](../ux/cockpit-wireframe.md).

## Étapes

- [ ] Vérifier les quatre alias et supprimer les actions/valeurs interdites plutôt que les laisser échouer ou afficher zéro.
- [ ] Adapter en-tête, KPI, alertes, checklist, flux et navigation à 390 px et aux largeurs intermédiaires.
- [ ] Ajouter action primaire persistante de 44 px minimum sans recouvrir contenu ni navigation système.
- [ ] Transformer les tableaux non compressibles en cartes ou scroll annoncé; préserver unités, signes et devise.
- [ ] Fermer navigation clavier, ordre de focus, libellés accessibles, contrastes et alternatives à la couleur.
- [ ] Tester indisponibilité partielle et changement de permission/session sur desktop et mobile.

## Preuves attendues

- Matrice de captures `owner`, `conducteur`, `chef-chantier`, `daf` sur desktop et au moins les vues utiles à 390 × 844.
- Tests composants/RBAC prouvant absence d'action interdite et absence de faux zéro.
- Audit accessibilité automatisé plus parcours clavier manuel sans blocage critique.
- Capture mobile complète sans troncature, chevauchement ni contenu masqué par l'action persistante.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec matrice de rôles, viewports, audit a11y et limitations.
